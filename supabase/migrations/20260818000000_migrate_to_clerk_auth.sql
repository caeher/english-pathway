-- Migration: 20260818000000_migrate_to_clerk_auth.sql
-- Transition user authentication and identity storage from Supabase Auth (auth.users UUID) to Clerk (TEXT user_id)

-- 1. Drop trigger on auth.users if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Drop existing foreign key constraints referencing auth.users(id)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.table_schema, tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  ) LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I;', r.table_schema, r.table_name, r.constraint_name);
  END LOOP;
END $$;

-- 3. Alter column types from UUID to TEXT for profiles and all dependent user tables

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

-- user_consents
ALTER TABLE public.user_consents
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- analytics_events
ALTER TABLE public.analytics_events
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- usage_credits
ALTER TABLE public.usage_credits
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- credit_transactions
ALTER TABLE public.credit_transactions
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- private_tutor_memories
ALTER TABLE public.private_tutor_memories
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- learner_memories (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learner_memories') THEN
    ALTER TABLE public.learner_memories ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;

-- english_assistant_prompt_logs
ALTER TABLE public.english_assistant_prompt_logs
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- english_assistant_conversations
ALTER TABLE public.english_assistant_conversations
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- rate_limit_buckets
ALTER TABLE public.rate_limit_buckets
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4. Re-establish foreign keys pointing to public.profiles(id) with ON DELETE CASCADE
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
  END IF;

  -- user_consents
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_consents_user_id_fkey') THEN
    ALTER TABLE public.user_consents ADD CONSTRAINT user_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- usage_credits
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'usage_credits_user_id_fkey') THEN
    ALTER TABLE public.usage_credits ADD CONSTRAINT usage_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- credit_transactions
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'credit_transactions_user_id_fkey') THEN
    ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- private_tutor_memories
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'private_tutor_memories_user_id_fkey') THEN
    ALTER TABLE public.private_tutor_memories ADD CONSTRAINT private_tutor_memories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- english_assistant_prompt_logs
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'english_assistant_prompt_logs_user_id_fkey') THEN
    ALTER TABLE public.english_assistant_prompt_logs ADD CONSTRAINT english_assistant_prompt_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- english_assistant_conversations
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'english_assistant_conversations_user_id_fkey') THEN
    ALTER TABLE public.english_assistant_conversations ADD CONSTRAINT english_assistant_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
