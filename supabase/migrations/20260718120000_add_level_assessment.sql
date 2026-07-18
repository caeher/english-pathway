ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assessment_recommended_level TEXT,
  ADD COLUMN IF NOT EXISTS assessment_confirmed_level TEXT,
  ADD COLUMN IF NOT EXISTS assessment_source TEXT,
  ADD COLUMN IF NOT EXISTS assessment_version TEXT,
  ADD COLUMN IF NOT EXISTS assessment_completed_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_assessment_recommended_level_check,
  ADD CONSTRAINT profiles_assessment_recommended_level_check
    CHECK (assessment_recommended_level IS NULL OR assessment_recommended_level IN ('beginner', 'intermediate', 'advanced')),
  DROP CONSTRAINT IF EXISTS profiles_assessment_confirmed_level_check,
  ADD CONSTRAINT profiles_assessment_confirmed_level_check
    CHECK (assessment_confirmed_level IS NULL OR assessment_confirmed_level IN ('beginner', 'intermediate', 'advanced')),
  DROP CONSTRAINT IF EXISTS profiles_assessment_source_check,
  ADD CONSTRAINT profiles_assessment_source_check
    CHECK (assessment_source IS NULL OR assessment_source IN ('voice', 'text', 'self_assessment'));

COMMENT ON COLUMN public.profiles.assessment_source IS
  'Source of the latest level assessment; audio and transcript are never stored by default.';
COMMENT ON COLUMN public.profiles.assessment_version IS
  'Version of the rubric used to produce the recommendation.';
