-- CEFR is the canonical learner level. Preserve legacy values temporarily so
-- existing onboarding/assessment records remain readable during deployment.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_level_check,
  ADD CONSTRAINT profiles_level_check
    CHECK (level IS NULL OR level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'beginner', 'intermediate', 'advanced'));

UPDATE public.profiles
SET level = CASE level
  WHEN 'beginner' THEN 'A1'
  WHEN 'intermediate' THEN 'B1'
  WHEN 'advanced' THEN 'C1'
  ELSE level
END
WHERE level IN ('beginner', 'intermediate', 'advanced');
