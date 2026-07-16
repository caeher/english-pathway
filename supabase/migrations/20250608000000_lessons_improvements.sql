-- New activity types
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'listening';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'dictation';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'pronunciation';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'drag-drop';

-- Streaks on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  rule_key TEXT NOT NULL,
  rule_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Spaced repetition review items
CREATE TABLE IF NOT EXISTS public.srs_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('flashcard', 'quiz', 'activity')),
  source_id TEXT NOT NULL,
  chapter_id TEXT REFERENCES public.chapters(id) ON DELETE SET NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_review_items_user_next ON public.srs_review_items(user_id, next_review_at);

-- Seed default achievements
INSERT INTO public.achievements (id, title, description, icon, category, xp_reward, rule_key, rule_value) VALUES
  ('first-lesson', 'Primera lección', 'Completa tu primera actividad', '🎯', 'progress', 25, 'activities_completed', 1),
  ('chapter-master', 'Maestro del capítulo', 'Completa un capítulo entero', '📚', 'progress', 50, 'chapters_completed', 1),
  ('streak-3', 'Racha de 3 días', 'Estudia 3 días seguidos', '🔥', 'streak', 30, 'streak_days', 3),
  ('streak-7', 'Racha de 7 días', 'Estudia 7 días seguidos', '🔥', 'streak', 75, 'streak_days', 7),
  ('xp-500', '500 XP', 'Acumula 500 puntos de experiencia', '⚡', 'xp', 50, 'total_xp', 500),
  ('xp-1000', '1000 XP', 'Acumula 1000 puntos de experiencia', '💎', 'xp', 100, 'total_xp', 1000),
  ('quiz-perfect', 'Quiz perfecto', 'Obtén 100% en un quiz', '🌟', 'skill', 40, 'perfect_quiz', 1),
  ('review-10', 'Repasador', 'Completa 10 repasos SRS', '🔄', 'review', 35, 'srs_reviews', 10)
ON CONFLICT (id) DO NOTHING;

-- RLS for new tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are readable by everyone"
  ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Users read own achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own achievements"
  ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own SRS items"
  ON public.srs_review_items FOR ALL USING (auth.uid() = user_id);
