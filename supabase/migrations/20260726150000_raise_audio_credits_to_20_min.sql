-- Raise registered-account voice allowance from 5 minutes (300s) to 20 minutes (1200s).
-- Existing audio_seconds_used values are preserved; users receive a +15 minute bonus automatically.

ALTER TABLE public.user_usage_credits
  DROP CONSTRAINT IF EXISTS user_usage_credits_audio_seconds_used_check;

ALTER TABLE public.user_usage_credits
  ADD CONSTRAINT user_usage_credits_audio_seconds_used_check
  CHECK (audio_seconds_used BETWEEN 0 AND 1200);

ALTER TABLE public.audio_credit_sessions
  DROP CONSTRAINT IF EXISTS audio_credit_sessions_max_seconds_check;

ALTER TABLE public.audio_credit_sessions
  ADD CONSTRAINT audio_credit_sessions_max_seconds_check
  CHECK (max_seconds BETWEEN 1 AND 1200);

CREATE OR REPLACE FUNCTION public.get_usage_credits()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credits public.user_usage_credits;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO credits FROM public.user_usage_credits WHERE user_id = auth.uid();
  RETURN jsonb_build_object(
    'audioSecondsRemaining', 1200 - credits.audio_seconds_used,
    'assistantMessagesRemaining', 50 - credits.assistant_messages_used
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.start_audio_credit_session()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credits public.user_usage_credits;
  active_session UUID;
  session_id UUID;
  remaining_seconds INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;

  WITH expired AS (
    UPDATE public.audio_credit_sessions
      SET status = 'expired', consumed_seconds = max_seconds, closed_at = NOW()
      WHERE user_id = auth.uid() AND status = 'active' AND expires_at <= NOW()
      RETURNING max_seconds
  )
  UPDATE public.user_usage_credits
    SET audio_seconds_used = LEAST(1200, audio_seconds_used + COALESCE((SELECT SUM(max_seconds) FROM expired), 0)), updated_at = NOW()
    WHERE user_id = auth.uid();

  SELECT * INTO credits FROM public.user_usage_credits WHERE user_id = auth.uid() FOR UPDATE;

  SELECT id INTO active_session
    FROM public.audio_credit_sessions
    WHERE user_id = auth.uid() AND status = 'active' AND expires_at > NOW()
    LIMIT 1;
  IF active_session IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'active_session');
  END IF;

  remaining_seconds := 1200 - credits.audio_seconds_used;
  IF remaining_seconds <= 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'credits_exhausted', 'audioSecondsRemaining', 0);
  END IF;

  INSERT INTO public.audio_credit_sessions (user_id, max_seconds, expires_at)
    VALUES (auth.uid(), remaining_seconds, NOW() + make_interval(secs => remaining_seconds))
    RETURNING id INTO session_id;
  RETURN jsonb_build_object('allowed', true, 'sessionId', session_id, 'maxSeconds', remaining_seconds);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_audio_credit_session(p_session_id UUID, p_seconds INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_row public.audio_credit_sessions;
  charged_seconds INTEGER;
  credits public.user_usage_credits;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO session_row FROM public.audio_credit_sessions
    WHERE id = p_session_id AND user_id = auth.uid() AND status = 'active'
    FOR UPDATE;
  IF NOT FOUND THEN
    RETURN public.get_usage_credits();
  END IF;
  charged_seconds := LEAST(session_row.max_seconds, GREATEST(0, p_seconds));
  UPDATE public.audio_credit_sessions
    SET status = 'closed', consumed_seconds = charged_seconds, closed_at = NOW()
    WHERE id = session_row.id;
  UPDATE public.user_usage_credits
    SET audio_seconds_used = LEAST(1200, audio_seconds_used + charged_seconds), updated_at = NOW()
    WHERE user_id = auth.uid()
    RETURNING * INTO credits;
  RETURN jsonb_build_object(
    'audioSecondsRemaining', 1200 - credits.audio_seconds_used,
    'assistantMessagesRemaining', 50 - credits.assistant_messages_used
  );
END;
$$;
