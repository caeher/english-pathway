-- Add last_heartbeat_at to audio_credit_sessions and fix stale session charging logic.
-- Stale/abandoned sessions now charge observed elapsed time instead of forfeiting the entire max_seconds cap.

-- 1. Add last_heartbeat_at column
ALTER TABLE public.audio_credit_sessions
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;

-- 2. Update get_usage_credits to lazily expire stale sessions and reflect in-flight session elapsed time
CREATE OR REPLACE FUNCTION public.get_usage_credits(p_user_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  credits public.user_usage_credits;
  v_active_elapsed INTEGER := 0;
  v_has_active BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  -- Expire any stale sessions whose lease has lapsed
  WITH expired AS (
    UPDATE public.audio_credit_sessions
      SET status = 'expired',
          consumed_seconds = LEAST(max_seconds,
            GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(last_heartbeat_at, started_at) - started_at))::integer + 30)),
          closed_at = NOW()
      WHERE user_id = v_user_id AND status = 'active' AND expires_at <= NOW()
      RETURNING consumed_seconds
  )
  UPDATE public.user_usage_credits
    SET audio_seconds_used = LEAST(1200, audio_seconds_used + COALESCE((SELECT SUM(consumed_seconds) FROM expired), 0)),
        updated_at = NOW()
    WHERE user_id = v_user_id;

  SELECT * INTO credits FROM public.user_usage_credits WHERE user_id = v_user_id;

  -- Account for any currently active session's in-flight elapsed time
  SELECT GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::integer)
    INTO v_active_elapsed
    FROM public.audio_credit_sessions
    WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
    LIMIT 1;

  IF FOUND THEN
    v_has_active := true;
    v_active_elapsed := LEAST(v_active_elapsed, GREATEST(0, 1200 - COALESCE(credits.audio_seconds_used, 0)));
  ELSE
    v_active_elapsed := 0;
  END IF;

  RETURN jsonb_build_object(
    'audioSecondsRemaining', GREATEST(0, 1200 - COALESCE(credits.audio_seconds_used, 0) - v_active_elapsed),
    'assistantMessagesRemaining', 50 - COALESCE(credits.assistant_messages_used, 0),
    'hasActiveSession', v_has_active,
    'activeSessionElapsed', v_active_elapsed
  );
END;
$$;

-- 3. Update start_audio_credit_session to use sliding expiration and safe elapsed charging on expired leases
CREATE OR REPLACE FUNCTION public.start_audio_credit_session(p_user_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  credits public.user_usage_credits;
  active_session UUID;
  session_id UUID;
  remaining_seconds INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  -- Recover abandoned sessions: charge elapsed time with conservative grace window, NOT max_seconds
  WITH expired AS (
    UPDATE public.audio_credit_sessions
      SET status = 'expired',
          consumed_seconds = LEAST(max_seconds,
            GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(last_heartbeat_at, started_at) - started_at))::integer + 30)),
          closed_at = NOW()
      WHERE user_id = v_user_id AND status = 'active' AND expires_at <= NOW()
      RETURNING consumed_seconds
  )
  UPDATE public.user_usage_credits
    SET audio_seconds_used = LEAST(1200, audio_seconds_used + COALESCE((SELECT SUM(consumed_seconds) FROM expired), 0)),
        updated_at = NOW()
    WHERE user_id = v_user_id;

  SELECT * INTO credits FROM public.user_usage_credits WHERE user_id = v_user_id FOR UPDATE;

  SELECT id INTO active_session
    FROM public.audio_credit_sessions
    WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
    LIMIT 1;
  IF active_session IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'active_session');
  END IF;

  remaining_seconds := 1200 - credits.audio_seconds_used;
  IF remaining_seconds <= 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'credits_exhausted', 'audioSecondsRemaining', 0);
  END IF;

  INSERT INTO public.audio_credit_sessions (
    user_id,
    max_seconds,
    expires_at,
    last_heartbeat_at
  ) VALUES (
    v_user_id,
    remaining_seconds,
    LEAST(NOW() + interval '90 seconds', NOW() + make_interval(secs => remaining_seconds)),
    NOW()
  )
  RETURNING id INTO session_id;

  RETURN jsonb_build_object('allowed', true, 'sessionId', session_id, 'maxSeconds', remaining_seconds);
END;
$$;

-- 4. Update finish_audio_credit_session with server-authoritative clamping
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
  credits public.user_usage_credits;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;

  SELECT * INTO session_row FROM public.audio_credit_sessions
    WHERE id = p_session_id AND user_id = v_user_id AND status = 'active'
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN public.get_usage_credits(v_user_id);
  END IF;

  -- Server-authoritative: clamp client value to server-observed elapsed + 5s tolerance
  server_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - session_row.started_at))::integer);
  charged_seconds := LEAST(session_row.max_seconds, LEAST(GREATEST(0, p_seconds), server_elapsed + 5));

  UPDATE public.audio_credit_sessions
    SET status = 'closed', consumed_seconds = charged_seconds, closed_at = NOW()
    WHERE id = session_row.id;

  UPDATE public.user_usage_credits
    SET audio_seconds_used = LEAST(1200, audio_seconds_used + charged_seconds), updated_at = NOW()
    WHERE user_id = v_user_id
    RETURNING * INTO credits;

  RETURN jsonb_build_object(
    'audioSecondsRemaining', 1200 - credits.audio_seconds_used,
    'assistantMessagesRemaining', 50 - credits.assistant_messages_used
  );
END;
$$;

-- 5. Create heartbeat_audio_credit_session
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
        expires_at = LEAST(NOW() + interval '90 seconds', started_at + make_interval(secs => max_seconds))
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

-- 6. Retroactive cleanup of any currently-active stale sessions
WITH settled AS (
  UPDATE public.audio_credit_sessions
    SET status = 'expired',
        consumed_seconds = LEAST(max_seconds,
          GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(last_heartbeat_at, started_at) - started_at))::integer + 30)),
        closed_at = NOW()
    WHERE status = 'active'
    RETURNING user_id, consumed_seconds
)
UPDATE public.user_usage_credits uc
  SET audio_seconds_used = LEAST(1200, uc.audio_seconds_used + s.total_consumed),
      updated_at = NOW()
FROM (
  SELECT user_id, SUM(consumed_seconds) as total_consumed
  FROM settled
  GROUP BY user_id
) s
WHERE uc.user_id = s.user_id;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_usage_credits(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.start_audio_credit_session(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.finish_audio_credit_session(UUID, INTEGER, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.heartbeat_audio_credit_session(UUID, TEXT) TO authenticated, anon, service_role;
