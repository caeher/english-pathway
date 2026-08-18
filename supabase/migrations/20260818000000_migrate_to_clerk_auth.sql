-- Migration: 20260818000000_migrate_to_clerk_auth.sql
-- Transition user authentication and identity storage from Supabase Auth (auth.users UUID) to Clerk (TEXT user_id)

-- 1. Drop trigger on auth.users if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Drop all existing RLS policies in public schema that might depend on column types
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 3. Drop all foreign key constraints on public tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conrelid::regclass AS table_name, conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND connamespace = 'public'::regnamespace
  ) LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I;', r.table_name, r.conname);
  END LOOP;
END $$;

-- 4. Alter column types from UUID to TEXT for profiles and all dependent user tables

-- profiles
ALTER TABLE public.profiles
  ALTER COLUMN id TYPE TEXT USING id::text;

-- user_progress
ALTER TABLE public.user_progress
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- activity_completions
ALTER TABLE public.activity_completions
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- chapter_completions
ALTER TABLE public.chapter_completions
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- user_engagement
ALTER TABLE public.user_engagement
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- daily_sessions
ALTER TABLE public.daily_sessions
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- srs_items
ALTER TABLE public.srs_items
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- user_achievements
ALTER TABLE public.user_achievements
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- engagement_activity_awards
ALTER TABLE public.engagement_activity_awards
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- engagement_activity_sessions
ALTER TABLE public.engagement_activity_sessions
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- user_consents
ALTER TABLE public.user_consents
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- analytics_events
ALTER TABLE public.analytics_events
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- user_usage_credits
ALTER TABLE public.user_usage_credits
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- audio_credit_sessions
ALTER TABLE public.audio_credit_sessions
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- tutor_session_summaries
ALTER TABLE public.tutor_session_summaries
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- learner_memory
ALTER TABLE public.learner_memory
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- english_assistant_prompt_logs
ALTER TABLE public.english_assistant_prompt_logs
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- english_assistant_conversations
ALTER TABLE public.english_assistant_conversations
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 5. Re-establish foreign keys pointing to public.profiles(id) with ON DELETE CASCADE
DO $$
BEGIN
  -- user_progress
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_progress_user_id_fkey') THEN
    ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- activity_completions
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'activity_completions_user_id_fkey') THEN
    ALTER TABLE public.activity_completions ADD CONSTRAINT activity_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- chapter_completions
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chapter_completions_user_id_fkey') THEN
    ALTER TABLE public.chapter_completions ADD CONSTRAINT chapter_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- user_engagement
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_engagement_user_id_fkey') THEN
    ALTER TABLE public.user_engagement ADD CONSTRAINT user_engagement_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- daily_sessions
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'daily_sessions_user_id_fkey') THEN
    ALTER TABLE public.daily_sessions ADD CONSTRAINT daily_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- srs_items
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'srs_items_user_id_fkey') THEN
    ALTER TABLE public.srs_items ADD CONSTRAINT srs_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- user_achievements
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_achievements_user_id_fkey') THEN
    ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;
  END IF;

  -- engagement_activity_awards
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'engagement_activity_awards_user_id_fkey') THEN
    ALTER TABLE public.engagement_activity_awards ADD CONSTRAINT engagement_activity_awards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- engagement_activity_sessions
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'engagement_activity_sessions_user_id_fkey') THEN
    ALTER TABLE public.engagement_activity_sessions ADD CONSTRAINT engagement_activity_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- user_consents
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_consents_user_id_fkey') THEN
    ALTER TABLE public.user_consents ADD CONSTRAINT user_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    ALTER TABLE public.user_consents ADD CONSTRAINT user_consents_legal_document_id_fkey FOREIGN KEY (legal_document_id) REFERENCES public.legal_documents(id) ON DELETE CASCADE;
  END IF;

  -- user_usage_credits
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_usage_credits_user_id_fkey') THEN
    ALTER TABLE public.user_usage_credits ADD CONSTRAINT user_usage_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- audio_credit_sessions
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audio_credit_sessions_user_id_fkey') THEN
    ALTER TABLE public.audio_credit_sessions ADD CONSTRAINT audio_credit_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- tutor_session_summaries
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_session_summaries_user_id_fkey') THEN
    ALTER TABLE public.tutor_session_summaries ADD CONSTRAINT tutor_session_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- learner_memory
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'learner_memory_user_id_fkey') THEN
    ALTER TABLE public.learner_memory ADD CONSTRAINT learner_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- english_assistant_prompt_logs
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'english_assistant_prompt_logs_user_id_fkey') THEN
    ALTER TABLE public.english_assistant_prompt_logs ADD CONSTRAINT english_assistant_prompt_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- english_assistant_conversations
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'english_assistant_conversations_user_id_fkey') THEN
    ALTER TABLE public.english_assistant_conversations ADD CONSTRAINT english_assistant_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- english_assistant_messages
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'english_assistant_messages_conversation_id_fkey') THEN
    ALTER TABLE public.english_assistant_messages ADD CONSTRAINT english_assistant_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.english_assistant_conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Re-create public read policies
CREATE POLICY "Public can view published legal documents" ON public.legal_documents
  FOR SELECT USING (published_at IS NOT NULL);

CREATE POLICY "Public can view achievements" ON public.achievements
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can view knowledge embeddings" ON public.knowledge_embeddings
  FOR SELECT USING (TRUE);

-- 7. Update RPC functions to accept text user_id

-- record_engagement_session
CREATE OR REPLACE FUNCTION public.record_engagement_session(
  p_activity_id TEXT,
  p_xp INTEGER,
  p_minutes INTEGER,
  p_local_date DATE,
  p_score INTEGER,
  p_user_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  v_activity_award_inserted INTEGER;
  v_session_inserted INTEGER;
  v_engagement public.user_engagement%ROWTYPE;
  v_daily public.daily_sessions%ROWTYPE;
  v_daily_goal INTEGER;
  v_new_achievements JSONB := '[]'::jsonb;
  v_achievement public.achievements%ROWTYPE;
  v_awarded_achievement_id TEXT;
  v_activity_xp INTEGER := GREATEST(0, p_xp);
  v_awarded_activity_xp INTEGER := 0;
  v_achievement_xp INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF btrim(COALESCE(p_activity_id, '')) = '' THEN
    RAISE EXCEPTION 'Invalid activity ID';
  END IF;
  IF p_xp IS NULL OR p_xp < 0 OR p_xp > 20 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;
  IF p_minutes IS NULL OR p_minutes < 1 OR p_minutes > 120 THEN
    RAISE EXCEPTION 'Invalid activity duration';
  END IF;
  IF p_score IS NULL OR p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'Invalid activity score';
  END IF;
  IF p_local_date IS NULL OR p_local_date < CURRENT_DATE - 1 OR p_local_date > CURRENT_DATE + 1 THEN
    RAISE EXCEPTION 'Invalid activity date';
  END IF;

  -- Lifetime XP idempotency
  INSERT INTO public.engagement_activity_awards (user_id, activity_id, xp_awarded)
  VALUES (v_user_id, p_activity_id, v_activity_xp)
  ON CONFLICT (user_id, activity_id) DO NOTHING;
  GET DIAGNOSTICS v_activity_award_inserted = ROW_COUNT;
  IF v_activity_award_inserted = 1 THEN
    v_awarded_activity_xp := v_activity_xp;
  END IF;

  -- Daily session idempotency
  INSERT INTO public.engagement_activity_sessions (user_id, activity_id, session_date)
  VALUES (v_user_id, p_activity_id, p_local_date)
  ON CONFLICT (user_id, activity_id, session_date) DO NOTHING;
  GET DIAGNOSTICS v_session_inserted = ROW_COUNT;

  IF v_session_inserted = 0 THEN
    SELECT * INTO v_engagement FROM public.user_engagement WHERE user_id = v_user_id;
    SELECT * INTO v_daily FROM public.daily_sessions
      WHERE user_id = v_user_id AND session_date = p_local_date;
    RETURN jsonb_build_object(
      'xpAwarded', 0,
      'activityXpAwarded', 0,
      'achievementXpAwarded', 0,
      'totalXp', COALESCE(v_engagement.total_xp, 0),
      'currentStreak', COALESCE(v_engagement.current_streak, 0),
      'longestStreak', COALESCE(v_engagement.longest_streak, 0),
      'dailyMinutes', COALESCE(v_daily.minutes_studied, 0),
      'dailyGoalMinutes', COALESCE((SELECT daily_goal_minutes FROM public.profiles WHERE id = v_user_id), 10),
      'newAchievementIds', '[]'::jsonb
    );
  END IF;

  INSERT INTO public.user_engagement (user_id, total_xp, current_streak, longest_streak, last_study_date)
  VALUES (v_user_id, v_awarded_activity_xp, 1, 1, p_local_date)
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = public.user_engagement.total_xp + v_awarded_activity_xp,
    current_streak = CASE
      WHEN public.user_engagement.last_study_date = p_local_date THEN public.user_engagement.current_streak
      WHEN public.user_engagement.last_study_date = p_local_date - 1 THEN public.user_engagement.current_streak + 1
      WHEN public.user_engagement.last_study_date IS NULL OR public.user_engagement.last_study_date < p_local_date THEN 1
      ELSE public.user_engagement.current_streak
    END,
    longest_streak = GREATEST(
      public.user_engagement.longest_streak,
      CASE
        WHEN public.user_engagement.last_study_date = p_local_date THEN public.user_engagement.current_streak
        WHEN public.user_engagement.last_study_date = p_local_date - 1 THEN public.user_engagement.current_streak + 1
        WHEN public.user_engagement.last_study_date IS NULL OR public.user_engagement.last_study_date < p_local_date THEN 1
        ELSE public.user_engagement.current_streak
      END
    ),
    last_study_date = GREATEST(COALESCE(public.user_engagement.last_study_date, p_local_date), p_local_date),
    updated_at = NOW();

  SELECT * INTO v_engagement FROM public.user_engagement WHERE user_id = v_user_id FOR UPDATE;
  v_daily_goal := COALESCE((SELECT daily_goal_minutes FROM public.profiles WHERE id = v_user_id), 10);

  INSERT INTO public.daily_sessions (user_id, session_date, minutes_studied, xp_earned, activities_completed, goal_met)
  VALUES (v_user_id, p_local_date, p_minutes, v_awarded_activity_xp, 1, p_minutes >= v_daily_goal)
  ON CONFLICT (user_id, session_date) DO UPDATE SET
    minutes_studied = public.daily_sessions.minutes_studied + EXCLUDED.minutes_studied,
    xp_earned = public.daily_sessions.xp_earned + EXCLUDED.xp_earned,
    activities_completed = public.daily_sessions.activities_completed + 1,
    goal_met = public.daily_sessions.minutes_studied + EXCLUDED.minutes_studied >= v_daily_goal,
    updated_at = NOW()
  RETURNING * INTO v_daily;

  LOOP
    SELECT a.* INTO v_achievement
    FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.user_id = v_user_id AND ua.achievement_id = a.id
    )
    AND (
      (a.rule_key = 'activities_completed' AND (SELECT COUNT(*) FROM public.engagement_activity_awards WHERE user_id = v_user_id) >= a.rule_value)
      OR (a.rule_key = 'streak_days' AND v_engagement.current_streak >= a.rule_value)
      OR (a.rule_key = 'total_xp' AND v_engagement.total_xp >= a.rule_value)
      OR (a.rule_key = 'perfect_activity' AND p_score >= 100)
    )
    ORDER BY a.id
    LIMIT 1;
    EXIT WHEN NOT FOUND;

    v_awarded_achievement_id := NULL;
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (v_user_id, v_achievement.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING achievement_id INTO v_awarded_achievement_id;

    IF v_awarded_achievement_id IS NULL THEN
      CONTINUE;
    END IF;

    v_new_achievements := v_new_achievements || jsonb_build_array(v_awarded_achievement_id);
    v_achievement_xp := v_achievement_xp + v_achievement.xp_reward;
    UPDATE public.user_engagement
    SET total_xp = total_xp + v_achievement.xp_reward,
        updated_at = NOW()
    WHERE user_id = v_user_id
    RETURNING * INTO v_engagement;
  END LOOP;

  IF v_achievement_xp > 0 THEN
    UPDATE public.daily_sessions
    SET xp_earned = xp_earned + v_achievement_xp,
        updated_at = NOW()
    WHERE user_id = v_user_id AND session_date = p_local_date
    RETURNING * INTO v_daily;
  END IF;

  RETURN jsonb_build_object(
    'xpAwarded', v_awarded_activity_xp + v_achievement_xp,
    'activityXpAwarded', v_awarded_activity_xp,
    'achievementXpAwarded', v_achievement_xp,
    'totalXp', v_engagement.total_xp,
    'currentStreak', v_engagement.current_streak,
    'longestStreak', v_engagement.longest_streak,
    'dailyMinutes', v_daily.minutes_studied,
    'dailyGoalMinutes', v_daily_goal,
    'newAchievementIds', v_new_achievements
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_engagement_session(TEXT, INTEGER, INTEGER, DATE, INTEGER, TEXT) TO authenticated, anon, service_role;

-- get_usage_credits
CREATE OR REPLACE FUNCTION public.get_usage_credits(p_user_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  credits public.user_usage_credits;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO credits FROM public.user_usage_credits WHERE user_id = v_user_id;
  RETURN jsonb_build_object(
    'audioSecondsRemaining', 1200 - COALESCE(credits.audio_seconds_used, 0),
    'assistantMessagesRemaining', 50 - COALESCE(credits.assistant_messages_used, 0)
  );
END;
$$;

-- start_audio_credit_session
CREATE OR REPLACE FUNCTION public.start_audio_credit_session(p_user_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  credits public.user_usage_credits;
  active_session UUID;
  session_id UUID;
  remaining_seconds INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;

  WITH expired AS (
    UPDATE public.audio_credit_sessions
      SET status = 'expired', consumed_seconds = max_seconds, closed_at = NOW()
      WHERE user_id = v_user_id AND status = 'active' AND expires_at <= NOW()
      RETURNING max_seconds
  )
  UPDATE public.user_usage_credits
    SET audio_seconds_used = LEAST(1200, audio_seconds_used + COALESCE((SELECT SUM(max_seconds) FROM expired), 0)), updated_at = NOW()
    WHERE user_id = v_user_id;

  SELECT * INTO credits FROM public.user_usage_credits WHERE user_id = v_user_id FOR UPDATE;

  SELECT id INTO active_session
    FROM public.audio_credit_sessions
    WHERE user_id = v_user_id AND status = 'active' AND expires_at > NOW()
    LIMIT 1;
  IF active_session IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'active_session');
  END IF;

  remaining_seconds := 1200 - credits.audio_seconds_used;
  IF remaining_seconds <= 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'credits_exhausted', 'audioSecondsRemaining', 0);
  END IF;

  INSERT INTO public.audio_credit_sessions (user_id, max_seconds, expires_at)
    VALUES (v_user_id, remaining_seconds, NOW() + make_interval(secs => remaining_seconds))
    RETURNING id INTO session_id;
  RETURN jsonb_build_object('allowed', true, 'sessionId', session_id, 'maxSeconds', remaining_seconds);
END;
$$;

-- finish_audio_credit_session
CREATE OR REPLACE FUNCTION public.finish_audio_credit_session(p_session_id UUID, p_seconds INTEGER, p_user_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  session_row public.audio_credit_sessions;
  charged_seconds INTEGER;
  credits public.user_usage_credits;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO session_row FROM public.audio_credit_sessions
    WHERE id = p_session_id AND user_id = v_user_id AND status = 'active'
    FOR UPDATE;
  IF NOT FOUND THEN
    RETURN public.get_usage_credits(v_user_id);
  END IF;
  charged_seconds := LEAST(session_row.max_seconds, GREATEST(0, p_seconds));
  UPDATE public.audio_credit_sessions
    SET status = 'closed', consumed_seconds = charged_seconds, closed_at = NOW()
    WHERE id = session_row.id;
  UPDATE public.user_usage_credits
    SET audio_seconds_used = LEAST(1200, audio_seconds_used + charged_seconds), updated_at = NOW()
    WHERE user_id = v_user_id
    RETURNING * INTO credits;
  RETURN jsonb_build_object(
    'audioSecondsRemaining', 1200 - credits.audio_seconds_used,
    'assistantMessagesRemaining', 50 - credits.assistant_messages_used
  );
END;
$$;

-- consume_assistant_credit
CREATE OR REPLACE FUNCTION public.consume_assistant_credit(p_user_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := COALESCE(p_user_id, auth.uid()::text);
  credits public.user_usage_credits;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.user_usage_credits (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_usage_credits
    SET assistant_messages_used = assistant_messages_used + 1, updated_at = NOW()
    WHERE user_id = v_user_id AND assistant_messages_used < 50
    RETURNING * INTO credits;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'assistantMessagesRemaining', 0);
  END IF;
  RETURN jsonb_build_object('allowed', true, 'assistantMessagesRemaining', 50 - credits.assistant_messages_used);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_usage_credits(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.start_audio_credit_session(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.finish_audio_credit_session(UUID, INTEGER, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.consume_assistant_credit(TEXT) TO authenticated, anon, service_role;
