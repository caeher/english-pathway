CREATE TABLE public.chapter_completions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chapter_id)
);

ALTER TABLE public.chapter_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chapter completions" ON public.chapter_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own chapter completions" ON public.chapter_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chapter completions" ON public.chapter_completions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
