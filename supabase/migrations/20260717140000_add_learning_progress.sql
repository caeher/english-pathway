CREATE TABLE public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_module_id TEXT,
  last_chapter_id TEXT,
  last_activity_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.activity_completions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  activity_type TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_id)
);

CREATE INDEX idx_activity_completions_user_chapter
  ON public.activity_completions(user_id, chapter_id);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own learning progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity completions" ON public.activity_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own activity completions" ON public.activity_completions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER activity_completions_updated_at
  BEFORE UPDATE ON public.activity_completions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
