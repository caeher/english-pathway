ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS native_language TEXT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_native_language_check,
  ADD CONSTRAINT profiles_native_language_check
    CHECK (
      native_language IS NULL
      OR native_language IN (
        'es', 'pt', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'hi', 'ru',
        'it', 'vi', 'tr', 'pl', 'nl', 'uk', 'id', 'th', 'bn'
      )
    );

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_onboarding_step_check,
  ADD CONSTRAINT profiles_onboarding_step_check
    CHECK (onboarding_step BETWEEN 0 AND 5);

UPDATE public.profiles
SET onboarding_step = 5
WHERE onboarding_completed_at IS NOT NULL
  AND onboarding_step = 4;

COMMENT ON COLUMN public.profiles.native_language IS
  'Optional BCP 47 language code for the learner native language.';
