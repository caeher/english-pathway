-- First-run onboarding preferences for authenticated learners.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS level TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_daily_goal_minutes_check,
  DROP CONSTRAINT IF EXISTS profiles_level_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_daily_goal_minutes_check
    CHECK (daily_goal_minutes IS NULL OR daily_goal_minutes IN (5, 10, 20)),
  ADD CONSTRAINT profiles_level_check
    CHECK (level IS NULL OR level IN ('beginner', 'intermediate', 'advanced'));

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'When the user completed or skipped the first-run onboarding flow';
COMMENT ON COLUMN public.profiles.daily_goal_minutes IS
  'Preferred daily English practice goal in minutes';
COMMENT ON COLUMN public.profiles.level IS
  'Self-reported English level';
