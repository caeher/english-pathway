-- Migration: 20260905100000_voice_promo_grants.sql
-- Description: Promotional voice grants (+2h for registered users, Sep 2026)

-- 1. Create voice_promo_grants table
CREATE TABLE IF NOT EXISTS public.voice_promo_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promo_key TEXT NOT NULL,
  granted_seconds INTEGER NOT NULL CHECK (granted_seconds > 0),
  consumed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (consumed_seconds >= 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, promo_key),
  CHECK (consumed_seconds <= granted_seconds),
  CHECK (valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_voice_promo_grants_user_valid_until
  ON public.voice_promo_grants(user_id, valid_until);

ALTER TABLE public.voice_promo_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own promo grants"
  ON public.voice_promo_grants FOR SELECT
  USING (user_id = auth.uid()::text);

-- 2. Helper: active promo remaining seconds
CREATE OR REPLACE FUNCTION public.get_active_promo_remaining(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(GREATEST(0, granted_seconds - consumed_seconds)), 0)::INTEGER
  FROM public.voice_promo_grants
  WHERE user_id = p_user_id
    AND valid_from <= NOW()
    AND valid_until > NOW();
$$;

-- 3. Helper: earliest active promo expiry
CREATE OR REPLACE FUNCTION public.get_active_promo_expires_at(p_user_id TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT MIN(valid_until)
  FROM public.voice_promo_grants
  WHERE user_id = p_user_id
    AND valid_from <= NOW()
    AND valid_until > NOW()
    AND consumed_seconds < granted_seconds;
$$;

-- 4. Helper: charge seconds (promo first by valid_until ASC, then period)
CREATE OR REPLACE FUNCTION public.charge_voice_seconds(
  p_user_id TEXT,
  p_quota_period_id UUID,
  p_seconds INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INTEGER := GREATEST(0, p_seconds);
  v_promo RECORD;
  v_promo_charge INTEGER;
BEGIN
  IF v_remaining <= 0 THEN
    RETURN 0;
  END IF;

  FOR v_promo IN
    SELECT id, granted_seconds, consumed_seconds
    FROM public.voice_promo_grants
    WHERE user_id = p_user_id
      AND valid_from <= NOW()
      AND valid_until > NOW()
      AND consumed_seconds < granted_seconds
    ORDER BY valid_until ASC
  LOOP
    v_promo_charge := LEAST(v_remaining, v_promo.granted_seconds - v_promo.consumed_seconds);
    UPDATE public.voice_promo_grants
      SET consumed_seconds = consumed_seconds + v_promo_charge
      WHERE id = v_promo.id;
    v_remaining := v_remaining - v_promo_charge;
    IF v_remaining <= 0 THEN
      RETURN p_seconds;
    END IF;
  END LOOP;

  IF p_quota_period_id IS NOT NULL AND v_remaining > 0 THEN
    UPDATE public.voice_usage_periods
      SET consumed_seconds = consumed_seconds + v_remaining,
          updated_at = NOW()
      WHERE id = p_quota_period_id;
  END IF;

  RETURN p_seconds;
END;
$$;

-- 5. Helper: settle expired audio sessions with promo-aware charging
CREATE OR REPLACE FUNCTION public.settle_expired_audio_sessions(p_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  FOR v_row IN
    UPDATE public.audio_credit_sessions
      SET status = 'expired',
          consumed_seconds = LEAST(max_seconds,
            GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(last_heartbeat_at, started_at) - started_at))::integer + 30)),
          closed_at = NOW()
      WHERE user_id = p_user_id AND status = 'active' AND expires_at <= NOW()
      RETURNING quota_period_id, consumed_seconds
  LOOP
    PERFORM public.charge_voice_seconds(p_user_id, v_row.quota_period_id, v_row.consumed_seconds);
    UPDATE public.user_usage_credits
      SET audio_seconds_used = audio_seconds_used + v_row.consumed_seconds,
          updated_at = NOW()
      WHERE user_id = p_user_id;
  END LOOP;
END;
$$;

-- 6. Grant promo (idempotent)
CREATE OR REPLACE FUNCTION public.grant_voice_promo(
  p_user_id TEXT,
  p_promo_key TEXT,
  p_seconds INTEGER,
  p_valid_until TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_promo_key IS NULL OR p_seconds IS NULL OR p_seconds <= 0 OR p_valid_until IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.voice_promo_grants (user_id, promo_key, granted_seconds, valid_until)
  VALUES (p_user_id, p_promo_key, p_seconds, p_valid_until)
  ON CONFLICT (user_id, promo_key) DO NOTHING;

  RETURN FOUND;
END;
$$;

-- 7. Grant active registered-user promos (Sep 2026 launch bonus)
CREATE OR REPLACE FUNCTION public.grant_active_registered_promos(p_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOW() < TIMESTAMPTZ '2026-10-01T00:00:00Z' THEN
    PERFORM public.grant_voice_promo(
      p_user_id,
      'registered_sep_2026',
      7200,
      TIMESTAMPTZ '2026-10-01T00:00:00Z'
    );
  END IF;
END;
$$;

-- 8. Upgraded get_usage_credits (includes promo balance)
CREATE OR REPLACE FUNCTION public.get_usage_credits(p_user_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  v_period RECORD;
  v_legacy_credits public.user_usage_credits;
  v_active_elapsed INTEGER := 0;
  v_has_active BOOLEAN := false;
  v_period_remaining INTEGER := 0;
  v_promo_remaining INTEGER := 0;
  v_promo_expires_at TIMESTAMPTZ;
  v_legacy_remaining INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  PERFORM public.grant_active_registered_promos(v_user_id);
  PERFORM public.settle_expired_audio_sessions(v_user_id);

  SELECT * INTO v_period FROM public.resolve_or_create_voice_period(v_user_id, false);

  SELECT GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::integer)
    INTO v_active_elapsed
    FROM public.audio_credit_sessions
    WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
    LIMIT 1;

  IF FOUND THEN
    v_has_active := true;
    IF NOT v_period.is_unlimited AND v_period.allocated_seconds IS NOT NULL THEN
      v_active_elapsed := LEAST(
        v_active_elapsed,
        GREATEST(0, COALESCE(v_period.allocated_seconds, 0) - v_period.consumed_seconds)
          + public.get_active_promo_remaining(v_user_id)
      );
    END IF;
  ELSE
    v_active_elapsed := 0;
  END IF;

  v_promo_remaining := public.get_active_promo_remaining(v_user_id);
  v_promo_expires_at := public.get_active_promo_expires_at(v_user_id);

  IF v_period.is_unlimited THEN
    v_legacy_remaining := 999999;
  ELSE
    v_period_remaining := GREATEST(0, COALESCE(v_period.allocated_seconds, 0) - v_period.consumed_seconds);
    v_legacy_remaining := GREATEST(0, v_period_remaining + v_promo_remaining - v_active_elapsed);
  END IF;

  SELECT * INTO v_legacy_credits FROM public.user_usage_credits WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'audioSecondsRemaining', v_legacy_remaining,
    'assistantMessagesRemaining', 50 - COALESCE(v_legacy_credits.assistant_messages_used, 0),
    'hasActiveSession', v_has_active,
    'activeSessionElapsed', v_active_elapsed,
    'voiceQuota', jsonb_build_object(
      'planKey', v_period.plan_key,
      'planName', v_period.plan_name,
      'isUnlimited', v_period.is_unlimited,
      'allowanceSeconds', v_period.allocated_seconds,
      'consumedSeconds', v_period.consumed_seconds,
      'remainingSeconds', CASE WHEN v_period.is_unlimited THEN NULL ELSE v_period_remaining END,
      'promoRemainingSeconds', v_promo_remaining,
      'promoExpiresAt', v_promo_expires_at,
      'periodStart', v_period.period_start,
      'periodEnd', v_period.period_end,
      'maxSessionSeconds', v_period.max_session_seconds
    )
  );
END;
$$;

-- 9. Upgraded start_audio_credit_session (promo + period total)
CREATE OR REPLACE FUNCTION public.start_audio_credit_session(p_user_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  v_period RECORD;
  active_session UUID;
  v_session_id UUID;
  v_period_remaining INTEGER;
  v_promo_remaining INTEGER;
  v_total_remaining INTEGER;
  v_session_max_seconds INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  PERFORM public.grant_active_registered_promos(v_user_id);
  PERFORM public.settle_expired_audio_sessions(v_user_id);

  SELECT * INTO v_period FROM public.resolve_or_create_voice_period(v_user_id, true);

  SELECT id INTO active_session
    FROM public.audio_credit_sessions
    WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
    LIMIT 1;

  IF active_session IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'active_session');
  END IF;

  IF v_period.is_unlimited THEN
    v_session_max_seconds := v_period.max_session_seconds;
  ELSE
    v_period_remaining := GREATEST(0, COALESCE(v_period.allocated_seconds, 0) - v_period.consumed_seconds);
    v_promo_remaining := public.get_active_promo_remaining(v_user_id);
    v_total_remaining := v_period_remaining + v_promo_remaining;

    IF v_total_remaining <= 0 THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'credits_exhausted', 'audioSecondsRemaining', 0);
    END IF;

    v_session_max_seconds := LEAST(v_period.max_session_seconds, v_total_remaining);
  END IF;

  INSERT INTO public.audio_credit_sessions (
    user_id,
    quota_period_id,
    max_seconds,
    expires_at,
    last_heartbeat_at
  ) VALUES (
    v_user_id,
    v_period.period_id,
    v_session_max_seconds,
    LEAST(NOW() + INTERVAL '90 seconds', NOW() + make_interval(secs => v_session_max_seconds)),
    NOW()
  )
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'sessionId', v_session_id,
    'maxSeconds', v_session_max_seconds,
    'isUnlimited', v_period.is_unlimited
  );
END;
$$;

-- 10. Upgraded finish_audio_credit_session (promo-first charging)
CREATE OR REPLACE FUNCTION public.finish_audio_credit_session(
  p_session_id UUID,
  p_seconds INTEGER,
  p_user_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  session_row public.audio_credit_sessions;
  server_elapsed INTEGER;
  charged_seconds INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;

  SELECT * INTO session_row FROM public.audio_credit_sessions
    WHERE id = p_session_id AND user_id = v_user_id AND status = 'active'
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN public.get_usage_credits(v_user_id);
  END IF;

  server_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - session_row.started_at))::integer);
  charged_seconds := LEAST(session_row.max_seconds, LEAST(GREATEST(0, p_seconds), server_elapsed + 5));

  UPDATE public.audio_credit_sessions
    SET status = 'closed',
        consumed_seconds = charged_seconds,
        closed_at = NOW()
    WHERE id = session_row.id;

  PERFORM public.charge_voice_seconds(v_user_id, session_row.quota_period_id, charged_seconds);

  UPDATE public.user_usage_credits
    SET audio_seconds_used = audio_seconds_used + charged_seconds,
        updated_at = NOW()
    WHERE user_id = v_user_id;

  RETURN public.get_usage_credits(v_user_id);
END;
$$;

-- 11. Backfill existing registered users with Sep 2026 promo
INSERT INTO public.voice_promo_grants (user_id, promo_key, granted_seconds, valid_until)
SELECT id, 'registered_sep_2026', 7200, TIMESTAMPTZ '2026-10-01T00:00:00Z'
FROM public.profiles
ON CONFLICT (user_id, promo_key) DO NOTHING;

-- 12. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_active_promo_remaining(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_active_promo_expires_at(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.charge_voice_seconds(TEXT, UUID, INTEGER) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.settle_expired_audio_sessions(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.grant_voice_promo(TEXT, TEXT, INTEGER, TIMESTAMPTZ) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.grant_active_registered_promos(TEXT) TO authenticated, anon, service_role;
