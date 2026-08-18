-- Migration: 20260818200000_plan_aware_voice_quotas.sql
-- Description: Plan-aware and period-aware voice quotas and entitlements

-- 1. Create voice_quota_plans table
CREATE TABLE IF NOT EXISTS public.voice_quota_plans (
  plan_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  allowance_seconds INTEGER CHECK (allowance_seconds IS NULL OR allowance_seconds >= 0),
  is_unlimited BOOLEAN NOT NULL DEFAULT false,
  renewal_policy TEXT NOT NULL CHECK (renewal_policy IN ('lifetime', 'monthly', 'yearly', 'none')),
  max_session_seconds INTEGER NOT NULL DEFAULT 1200 CHECK (max_session_seconds > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create user_voice_entitlements table
CREATE TABLE IF NOT EXISTS public.user_voice_entitlements (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL REFERENCES public.voice_quota_plans(plan_key),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  override_allowance_seconds INTEGER CHECK (override_allowance_seconds IS NULL OR override_allowance_seconds >= 0),
  override_is_unlimited BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create voice_usage_periods table
CREATE TABLE IF NOT EXISTS public.voice_usage_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL REFERENCES public.voice_quota_plans(plan_key),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ,
  allocated_seconds INTEGER CHECK (allocated_seconds IS NULL OR allocated_seconds >= 0),
  is_unlimited BOOLEAN NOT NULL DEFAULT false,
  consumed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (consumed_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_usage_periods_user_period
  ON public.voice_usage_periods(user_id, period_start DESC);

-- 4. Alter audio_credit_sessions table
ALTER TABLE public.audio_credit_sessions
  ADD COLUMN IF NOT EXISTS quota_period_id UUID REFERENCES public.voice_usage_periods(id) ON DELETE SET NULL;

ALTER TABLE public.audio_credit_sessions
  DROP CONSTRAINT IF EXISTS audio_credit_sessions_max_seconds_check;

ALTER TABLE public.audio_credit_sessions
  ADD CONSTRAINT audio_credit_sessions_max_seconds_check CHECK (max_seconds > 0);

-- Relax legacy check constraint on user_usage_credits
ALTER TABLE public.user_usage_credits
  DROP CONSTRAINT IF EXISTS user_usage_credits_audio_seconds_used_check;

ALTER TABLE public.user_usage_credits
  ADD CONSTRAINT user_usage_credits_audio_seconds_used_check CHECK (audio_seconds_used >= 0);

-- 5. Seed default plans
INSERT INTO public.voice_quota_plans (
  plan_key,
  name,
  allowance_seconds,
  is_unlimited,
  renewal_policy,
  max_session_seconds
) VALUES
  ('free', 'Free Trial', 1200, false, 'lifetime', 1200),
  ('monthly_standard', 'Monthly Standard', 3600, false, 'monthly', 1200),
  ('monthly_unlimited', 'Monthly Unlimited', NULL, true, 'monthly', 1800)
ON CONFLICT (plan_key) DO UPDATE SET
  name = EXCLUDED.name,
  allowance_seconds = EXCLUDED.allowance_seconds,
  is_unlimited = EXCLUDED.is_unlimited,
  renewal_policy = EXCLUDED.renewal_policy,
  max_session_seconds = EXCLUDED.max_session_seconds;

-- 6. Backfill existing users into free plan and lifetime period
INSERT INTO public.user_voice_entitlements (user_id, plan_key, status, started_at)
SELECT
  p.id,
  'free',
  'active',
  COALESCE(p.created_at, NOW())
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.voice_usage_periods (
  user_id,
  plan_key,
  period_start,
  period_end,
  allocated_seconds,
  is_unlimited,
  consumed_seconds,
  created_at,
  updated_at
)
SELECT
  p.id,
  'free',
  COALESCE(p.created_at, NOW()),
  NULL,
  1200,
  false,
  COALESCE(uc.audio_seconds_used, 0),
  COALESCE(p.created_at, NOW()),
  NOW()
FROM public.profiles p
LEFT JOIN public.user_usage_credits uc ON uc.user_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.voice_usage_periods vup WHERE vup.user_id = p.id
);

-- Backfill audio_credit_sessions.quota_period_id
UPDATE public.audio_credit_sessions acs
SET quota_period_id = vup.id
FROM public.voice_usage_periods vup
WHERE acs.user_id = vup.user_id
  AND acs.quota_period_id IS NULL;

-- 7. Enable RLS
ALTER TABLE public.voice_quota_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_voice_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_usage_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quota plans"
  ON public.voice_quota_plans FOR SELECT
  USING (true);

CREATE POLICY "Users read own voice entitlement"
  ON public.user_voice_entitlements FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users read own voice usage periods"
  ON public.voice_usage_periods FOR SELECT
  USING (auth.uid()::text = user_id);

-- 8. Core SQL helper to resolve or create the active voice period
CREATE OR REPLACE FUNCTION public.resolve_or_create_voice_period(
  p_user_id TEXT,
  p_for_update BOOLEAN DEFAULT false
)
RETURNS TABLE (
  period_id UUID,
  plan_key TEXT,
  plan_name TEXT,
  renewal_policy TEXT,
  max_session_seconds INTEGER,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  allocated_seconds INTEGER,
  is_unlimited BOOLEAN,
  consumed_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entitlement RECORD;
  v_plan RECORD;
  v_period RECORD;
  v_effective_allowance INTEGER;
  v_effective_unlimited BOOLEAN;
  v_curr_start TIMESTAMPTZ;
  v_curr_end TIMESTAMPTZ;
BEGIN
  -- Ensure entitlement exists, default to free
  INSERT INTO public.user_voice_entitlements (user_id, plan_key, status)
  VALUES (p_user_id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT e.*, p.name as plan_name, p.allowance_seconds as plan_allowance,
         p.is_unlimited as plan_is_unlimited, p.renewal_policy as plan_renewal,
         p.max_session_seconds as plan_max_session
  INTO v_entitlement
  FROM public.user_voice_entitlements e
  JOIN public.voice_quota_plans p ON p.plan_key = e.plan_key
  WHERE e.user_id = p_user_id;

  v_effective_unlimited := COALESCE(v_entitlement.override_is_unlimited, v_entitlement.plan_is_unlimited);
  IF v_effective_unlimited THEN
    v_effective_allowance := NULL;
  ELSE
    v_effective_allowance := COALESCE(v_entitlement.override_allowance_seconds, v_entitlement.plan_allowance);
  END IF;

  -- Find latest period
  IF p_for_update THEN
    SELECT * INTO v_period
    FROM public.voice_usage_periods
    WHERE user_id = p_user_id
    ORDER BY period_start DESC
    LIMIT 1
    FOR UPDATE;
  ELSE
    SELECT * INTO v_period
    FROM public.voice_usage_periods
    WHERE user_id = p_user_id
    ORDER BY period_start DESC
    LIMIT 1;
  END IF;

  -- If no period exists, create initial period
  IF v_period.id IS NULL THEN
    IF v_entitlement.plan_renewal = 'monthly' THEN
      v_curr_start := v_entitlement.started_at;
      v_curr_end := v_curr_start + INTERVAL '1 month';
      WHILE v_curr_end <= NOW() LOOP
        v_curr_start := v_curr_end;
        v_curr_end := v_curr_start + INTERVAL '1 month';
      END LOOP;
    ELSE
      v_curr_start := v_entitlement.started_at;
      v_curr_end := NULL;
    END IF;

    INSERT INTO public.voice_usage_periods (
      user_id,
      plan_key,
      period_start,
      period_end,
      allocated_seconds,
      is_unlimited,
      consumed_seconds
    ) VALUES (
      p_user_id,
      v_entitlement.plan_key,
      v_curr_start,
      v_curr_end,
      v_effective_allowance,
      v_effective_unlimited,
      0
    )
    RETURNING * INTO v_period;
  ELSIF v_entitlement.plan_renewal = 'monthly' AND v_period.period_end IS NOT NULL AND v_period.period_end <= NOW() THEN
    -- Deterministic rollover for periodic plans
    v_curr_start := v_period.period_end;
    v_curr_end := v_curr_start + INTERVAL '1 month';
    WHILE v_curr_end <= NOW() LOOP
      v_curr_start := v_curr_end;
      v_curr_end := v_curr_start + INTERVAL '1 month';
    END LOOP;

    INSERT INTO public.voice_usage_periods (
      user_id,
      plan_key,
      period_start,
      period_end,
      allocated_seconds,
      is_unlimited,
      consumed_seconds
    ) VALUES (
      p_user_id,
      v_entitlement.plan_key,
      v_curr_start,
      v_curr_end,
      v_effective_allowance,
      v_effective_unlimited,
      0
    )
    RETURNING * INTO v_period;
  END IF;

  RETURN QUERY SELECT
    v_period.id,
    v_entitlement.plan_key,
    v_entitlement.plan_name,
    v_entitlement.plan_renewal,
    v_entitlement.plan_max_session,
    v_period.period_start,
    v_period.period_end,
    v_period.allocated_seconds,
    v_period.is_unlimited,
    v_period.consumed_seconds;
END;
$$;

-- 9. Upgraded get_usage_credits
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
  v_remaining_seconds INTEGER := NULL;
  v_legacy_remaining INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  -- Expire any stale sessions whose lease has lapsed and charge elapsed time
  WITH expired AS (
    UPDATE public.audio_credit_sessions
      SET status = 'expired',
          consumed_seconds = LEAST(max_seconds,
            GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(last_heartbeat_at, started_at) - started_at))::integer + 30)),
          closed_at = NOW()
      WHERE user_id = v_user_id AND status = 'active' AND expires_at <= NOW()
      RETURNING quota_period_id, consumed_seconds
  )
  UPDATE public.voice_usage_periods vup
    SET consumed_seconds = vup.consumed_seconds + COALESCE(exp_sum.total, 0),
        updated_at = NOW()
  FROM (
    SELECT quota_period_id, SUM(consumed_seconds) AS total
    FROM expired
    WHERE quota_period_id IS NOT NULL
    GROUP BY quota_period_id
  ) exp_sum
  WHERE vup.id = exp_sum.quota_period_id;

  -- Resolve the user's active quota period
  SELECT * INTO v_period FROM public.resolve_or_create_voice_period(v_user_id, false);

  -- Account for currently active session in flight
  SELECT GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::integer)
    INTO v_active_elapsed
    FROM public.audio_credit_sessions
    WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
    LIMIT 1;

  IF FOUND THEN
    v_has_active := true;
    IF NOT v_period.is_unlimited AND v_period.allocated_seconds IS NOT NULL THEN
      v_active_elapsed := LEAST(v_active_elapsed, GREATEST(0, v_period.allocated_seconds - v_period.consumed_seconds));
    END IF;
  ELSE
    v_active_elapsed := 0;
  END IF;

  IF v_period.is_unlimited THEN
    v_remaining_seconds := NULL;
    v_legacy_remaining := 999999;
  ELSE
    v_remaining_seconds := GREATEST(0, COALESCE(v_period.allocated_seconds, 0) - v_period.consumed_seconds - v_active_elapsed);
    v_legacy_remaining := v_remaining_seconds;
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
      'remainingSeconds', v_remaining_seconds,
      'periodStart', v_period.period_start,
      'periodEnd', v_period.period_end,
      'maxSessionSeconds', v_period.max_session_seconds
    )
  );
END;
$$;

-- 10. Upgraded start_audio_credit_session
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
  v_remaining_seconds INTEGER;
  v_session_max_seconds INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  -- Recover stale sessions
  WITH expired AS (
    UPDATE public.audio_credit_sessions
      SET status = 'expired',
          consumed_seconds = LEAST(max_seconds,
            GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(last_heartbeat_at, started_at) - started_at))::integer + 30)),
          closed_at = NOW()
      WHERE user_id = v_user_id AND status = 'active' AND expires_at <= NOW()
      RETURNING quota_period_id, consumed_seconds
  )
  UPDATE public.voice_usage_periods vup
    SET consumed_seconds = vup.consumed_seconds + COALESCE(exp_sum.total, 0),
        updated_at = NOW()
  FROM (
    SELECT quota_period_id, SUM(consumed_seconds) AS total
    FROM expired
    WHERE quota_period_id IS NOT NULL
    GROUP BY quota_period_id
  ) exp_sum
  WHERE vup.id = exp_sum.quota_period_id;

  -- Lock and resolve active period
  SELECT * INTO v_period FROM public.resolve_or_create_voice_period(v_user_id, true);

  -- Check for existing active unexpired session
  SELECT id INTO active_session
    FROM public.audio_credit_sessions
    WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
    LIMIT 1;

  IF active_session IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'active_session');
  END IF;

  -- Calculate session capacity
  IF v_period.is_unlimited THEN
    v_session_max_seconds := v_period.max_session_seconds;
  ELSE
    v_remaining_seconds := GREATEST(0, COALESCE(v_period.allocated_seconds, 0) - v_period.consumed_seconds);
    IF v_remaining_seconds <= 0 THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'credits_exhausted', 'audioSecondsRemaining', 0);
    END IF;
    v_session_max_seconds := LEAST(v_period.max_session_seconds, v_remaining_seconds);
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

-- 11. Upgraded heartbeat_audio_credit_session
CREATE OR REPLACE FUNCTION public.heartbeat_audio_credit_session(
  p_session_id UUID,
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
  v_elapsed INTEGER;
  v_remaining INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;

  UPDATE public.audio_credit_sessions
    SET last_heartbeat_at = NOW(),
        expires_at = LEAST(NOW() + INTERVAL '90 seconds', started_at + make_interval(secs => max_seconds))
    WHERE id = p_session_id AND user_id = v_user_id AND status = 'active'
    RETURNING * INTO session_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'session_not_found');
  END IF;

  v_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - session_row.started_at))::integer);
  v_remaining := GREATEST(0, session_row.max_seconds - v_elapsed);

  RETURN jsonb_build_object(
    'sessionId', p_session_id,
    'elapsed', v_elapsed,
    'remaining', v_remaining
  );
END;
$$;

-- 12. Upgraded finish_audio_credit_session
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

  -- Server-authoritative clamping with 5s tolerance
  server_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - session_row.started_at))::integer);
  charged_seconds := LEAST(session_row.max_seconds, LEAST(GREATEST(0, p_seconds), server_elapsed + 5));

  UPDATE public.audio_credit_sessions
    SET status = 'closed',
        consumed_seconds = charged_seconds,
        closed_at = NOW()
    WHERE id = session_row.id;

  IF session_row.quota_period_id IS NOT NULL THEN
    UPDATE public.voice_usage_periods
      SET consumed_seconds = consumed_seconds + charged_seconds,
          updated_at = NOW()
      WHERE id = session_row.quota_period_id;
  END IF;

  -- Keep legacy table in sync for backward compatibility
  UPDATE public.user_usage_credits
    SET audio_seconds_used = audio_seconds_used + charged_seconds,
        updated_at = NOW()
    WHERE user_id = v_user_id;

  RETURN public.get_usage_credits(v_user_id);
END;
$$;

-- 13. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.resolve_or_create_voice_period(TEXT, BOOLEAN) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_usage_credits(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.start_audio_credit_session(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.finish_audio_credit_session(UUID, INTEGER, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.heartbeat_audio_credit_session(UUID, TEXT) TO authenticated, anon, service_role;
