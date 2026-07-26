-- Add approval tracking for curriculum exercise policy.
ALTER TABLE activity_completions
  ADD COLUMN IF NOT EXISTS passed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

-- Existing completed rows without evidence stay unpassed until backfill runs.
COMMENT ON COLUMN activity_completions.passed IS 'Sticky approval flag derived from chapter activity policy.';
COMMENT ON COLUMN activity_completions.last_attempt_at IS 'Timestamp of the most recent learner attempt.';
