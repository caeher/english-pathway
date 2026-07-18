ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_mode TEXT NOT NULL DEFAULT 'text';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_mode_check,
  ADD CONSTRAINT profiles_preferred_mode_check
    CHECK (preferred_mode IN ('voice', 'text'));

COMMENT ON COLUMN public.profiles.preferred_mode IS
  'The learner preferred practice mode. This is a preference, not an assessment result.';
