CREATE TABLE public.english_assistant_prompt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL CHECK (char_length(prompt) BETWEEN 1 AND 2000),
  response TEXT CHECK (response IS NULL OR char_length(response) BETWEEN 1 AND 12000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_english_assistant_prompt_logs_user_created
  ON public.english_assistant_prompt_logs(user_id, created_at DESC);

ALTER TABLE public.english_assistant_prompt_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own English assistant prompt logs"
  ON public.english_assistant_prompt_logs FOR SELECT
  USING (auth.uid() = user_id);
