ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS onboarding_step SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_onboarding_status_check,
  ADD CONSTRAINT profiles_onboarding_status_check
    CHECK (onboarding_status IN ('pending', 'completed', 'skipped')),
  DROP CONSTRAINT IF EXISTS profiles_onboarding_step_check,
  ADD CONSTRAINT profiles_onboarding_step_check
    CHECK (onboarding_step BETWEEN 0 AND 4);

UPDATE public.profiles
SET onboarding_status = CASE
  WHEN onboarding_completed_at IS NOT NULL THEN 'completed'
  ELSE onboarding_status
END
WHERE onboarding_completed_at IS NOT NULL;

COMMENT ON COLUMN public.profiles.onboarding_status IS
  'Explicit onboarding state: pending, completed, or skipped.';
COMMENT ON COLUMN public.profiles.onboarding_step IS
  'Last persisted onboarding step, used to resume the setup flow.';
