CREATE TABLE public.user_usage_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_seconds_used INTEGER NOT NULL DEFAULT 0 CHECK (audio_seconds_used BETWEEN 0 AND 300),
  assistant_messages_used INTEGER NOT NULL DEFAULT 0 CHECK (assistant_messages_used BETWEEN 0 AND 50),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.audio_credit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_seconds INTEGER NOT NULL CHECK (max_seconds BETWEEN 1 AND 300),
  consumed_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_audio_credit_sessions_user_active
  ON public.audio_credit_sessions(user_id, status, expires_at);

ALTER TABLE public.user_usage_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_credit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own usage credits"
  ON public.user_usage_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own audio credit sessions"
  ON public.audio_credit_sessions FOR SELECT
  USING (auth.uid() = user_id);

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
    'audioSecondsRemaining', 300 - credits.audio_seconds_used,
    'assistantMessagesRemaining', 50 - credits.assistant_messages_used
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_assistant_credit()
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
  UPDATE public.user_usage_credits
    SET assistant_messages_used = assistant_messages_used + 1, updated_at = NOW()
    WHERE user_id = auth.uid() AND assistant_messages_used < 50
    RETURNING * INTO credits;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'assistantMessagesRemaining', 0);
  END IF;
  RETURN jsonb_build_object('allowed', true, 'assistantMessagesRemaining', 50 - credits.assistant_messages_used);
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

  -- An abandoned browser session is charged at its cap before a new one can start.
  WITH expired AS (
    UPDATE public.audio_credit_sessions
      SET status = 'expired', consumed_seconds = max_seconds, closed_at = NOW()
      WHERE user_id = auth.uid() AND status = 'active' AND expires_at <= NOW()
      RETURNING max_seconds
  )
  UPDATE public.user_usage_credits
    SET audio_seconds_used = LEAST(300, audio_seconds_used + COALESCE((SELECT SUM(max_seconds) FROM expired), 0)), updated_at = NOW()
    WHERE user_id = auth.uid();

  -- Serialise starts for the same user so concurrent tabs cannot open two leases.
  SELECT * INTO credits FROM public.user_usage_credits WHERE user_id = auth.uid() FOR UPDATE;

  SELECT id INTO active_session
    FROM public.audio_credit_sessions
    WHERE user_id = auth.uid() AND status = 'active' AND expires_at > NOW()
    LIMIT 1;
  IF active_session IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'active_session');
  END IF;

  remaining_seconds := 300 - credits.audio_seconds_used;
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
    SET audio_seconds_used = LEAST(300, audio_seconds_used + charged_seconds), updated_at = NOW()
    WHERE user_id = auth.uid()
    RETURNING * INTO credits;
  RETURN jsonb_build_object(
    'audioSecondsRemaining', 300 - credits.audio_seconds_used,
    'assistantMessagesRemaining', 50 - credits.assistant_messages_used
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_usage_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_assistant_credit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_audio_credit_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_audio_credit_session(UUID, INTEGER) TO authenticated;
