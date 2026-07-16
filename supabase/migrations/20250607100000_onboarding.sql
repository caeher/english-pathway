-- Onboarding fields for user profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS english_level TEXT CHECK (english_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS daily_goal INTEGER CHECK (daily_goal IN (5, 10, 20)),
  ADD COLUMN IF NOT EXISTS interests JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed the welcome onboarding flow';
COMMENT ON COLUMN public.profiles.english_level IS 'Self-reported English level: beginner, intermediate, or advanced';
COMMENT ON COLUMN public.profiles.daily_goal IS 'Daily study goal in minutes: 5, 10, or 20';
COMMENT ON COLUMN public.profiles.interests IS 'Array of learning interest tags selected during onboarding';
