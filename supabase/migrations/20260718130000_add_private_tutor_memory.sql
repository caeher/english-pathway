-- Private tutor memory is intentionally separate from the shared curriculum RAG.
-- Store summaries and short learner notes only; never raw audio or full transcripts.
CREATE TABLE public.tutor_session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  correlation_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('preparing', 'context', 'explaining', 'activity_presented', 'waiting_response', 'evaluating', 'help', 'reinforcing', 'next_step', 'closed')),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 4000),
  last_activity_id TEXT,
  strategy_version TEXT NOT NULL DEFAULT 'tutor-memory-v1',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, correlation_id)
);

CREATE TABLE public.learner_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_key TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  source TEXT NOT NULL CHECK (source IN ('activity_result', 'help_request', 'session_end', 'preference_update')),
  strategy_version TEXT NOT NULL DEFAULT 'learner-memory-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, memory_key)
);

CREATE INDEX idx_tutor_session_summaries_user_updated
  ON public.tutor_session_summaries(user_id, updated_at DESC);
CREATE INDEX idx_tutor_session_summaries_expiry
  ON public.tutor_session_summaries(expires_at);
CREATE INDEX idx_learner_memory_user_updated
  ON public.learner_memory(user_id, updated_at DESC);

ALTER TABLE public.tutor_session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tutor session summaries"
  ON public.tutor_session_summaries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own learner memory"
  ON public.learner_memory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER tutor_session_summaries_updated_at
  BEFORE UPDATE ON public.tutor_session_summaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER learner_memory_updated_at
  BEFORE UPDATE ON public.learner_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Analytics are attributable but not readable cross-user.
DROP POLICY IF EXISTS "Anyone can read analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins read analytics" ON public.analytics_events;
CREATE POLICY "Users read own analytics events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- The shared curriculum RAG is queried by the service layer; anonymous direct RPC access is unnecessary.
REVOKE EXECUTE ON FUNCTION public.match_knowledge(vector, INTEGER, JSONB) FROM anon;
