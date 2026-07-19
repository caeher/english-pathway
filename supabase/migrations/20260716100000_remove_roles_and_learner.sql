-- Remove roles, teacher features, learner progress/gamification, and RAG tables.
-- Simplify profiles to basic account fields only.

-- Drop teacher tables
DROP TABLE IF EXISTS public.teacher_module_assignments CASCADE;
DROP TABLE IF EXISTS public.teacher_quizzes CASCADE;

-- Drop progress / gamification / engagement tables
DROP TABLE IF EXISTS public.user_activity_progress CASCADE;
DROP TABLE IF EXISTS public.user_chapter_progress CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.srs_review_items CASCADE;
DROP TABLE IF EXISTS public.daily_sessions CASCADE;
DROP TABLE IF EXISTS public.user_game_stats CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.engagement_emails CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;

-- Drop RAG (voice tutor removed)
DROP FUNCTION IF EXISTS public.match_knowledge(vector, INTEGER, JSONB);
DROP TABLE IF EXISTS public.knowledge_embeddings CASCADE;

-- Drop profile policies that reference roles before dropping the functions.
-- PostgreSQL does not allow dropping a function while an RLS policy depends on it.
-- These policies are recreated below with the simplified owner/public rules.
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile role" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can update their student profiles" ON public.profiles;

DROP POLICY IF EXISTS "Published legal documents are viewable by everyone" ON public.legal_documents;
DROP POLICY IF EXISTS "Admins can manage legal documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Users can view own consents" ON public.user_consents;

-- Remove content policies that depend on is_staff() before dropping that function.
DROP POLICY IF EXISTS "Published modules are viewable by everyone" ON public.modules;
DROP POLICY IF EXISTS "Staff can manage modules" ON public.modules;
DROP POLICY IF EXISTS "Published chapters are viewable by everyone" ON public.chapters;
DROP POLICY IF EXISTS "Staff can manage chapters" ON public.chapters;
DROP POLICY IF EXISTS "Published objectives are viewable by everyone" ON public.chapter_objectives;
DROP POLICY IF EXISTS "Staff can manage objectives" ON public.chapter_objectives;
DROP POLICY IF EXISTS "Published activities are viewable by everyone" ON public.activities;
DROP POLICY IF EXISTS "Staff can manage activities" ON public.activities;
DROP POLICY IF EXISTS "Staff can manage word search puzzles" ON public.word_search_puzzles;
DROP POLICY IF EXISTS "Word search puzzles are viewable by everyone" ON public.word_search_puzzles;

-- Drop role-dependent triggers and functions
DROP TRIGGER IF EXISTS profiles_protect_sensitive_fields ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_sensitive_fields();
DROP FUNCTION IF EXISTS public.add_user_xp(INTEGER);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_staff();
DROP FUNCTION IF EXISTS public.has_role(public.user_role);

-- Drop analytics admin policy
DROP POLICY IF EXISTS "Admins read analytics" ON public.analytics_events;

-- Simplify profiles: remove learner/role columns
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS total_xp,
  DROP COLUMN IF EXISTS onboarding_completed,
  DROP COLUMN IF EXISTS english_level,
  DROP COLUMN IF EXISTS daily_goal,
  DROP COLUMN IF EXISTS interests,
  DROP COLUMN IF EXISTS current_streak,
  DROP COLUMN IF EXISTS longest_streak,
  DROP COLUMN IF EXISTS last_active_date,
  DROP COLUMN IF EXISTS notification_preferences,
  DROP COLUMN IF EXISTS streak_freezes_remaining,
  DROP COLUMN IF EXISTS streak_freeze_reset_at,
  DROP COLUMN IF EXISTS referral_code,
  DROP COLUMN IF EXISTS referred_by,
  DROP COLUMN IF EXISTS last_chapter_id,
  DROP COLUMN IF EXISTS last_activity_id,
  DROP COLUMN IF EXISTS last_activity_at,
  DROP COLUMN IF EXISTS beginner_sequencing,
  DROP COLUMN IF EXISTS teacher_id,
  DROP COLUMN IF EXISTS class_name,
  DROP COLUMN IF EXISTS locale;

DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_referral_code;

-- Drop user_role enum
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Drop progress_status enum (tables dropped)
DROP TYPE IF EXISTS public.progress_status CASCADE;

-- New profile policies (owner only)
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles are updatable by owner"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Content: public read for published, no in-app writes
CREATE POLICY "Published modules are viewable by everyone"
  ON public.modules FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Published chapters are viewable by everyone"
  ON public.chapters FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Published objectives are viewable by everyone"
  ON public.chapter_objectives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters c
      WHERE c.id = chapter_id AND c.published = TRUE
    )
  );

CREATE POLICY "Published activities are viewable by everyone"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters c
      WHERE c.id = chapter_id AND c.published = TRUE
    )
  );

CREATE POLICY "Word search puzzles are viewable by everyone"
  ON public.word_search_puzzles FOR SELECT
  USING (TRUE);

-- Legal: published documents public
CREATE POLICY "Published legal documents are viewable by everyone"
  ON public.legal_documents FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Users can view own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Analytics: anyone can insert, no admin read policy needed
CREATE POLICY "Anyone can read analytics events"
  ON public.analytics_events FOR SELECT
  USING (true);
