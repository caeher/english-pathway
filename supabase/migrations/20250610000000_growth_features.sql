-- Growth features: daily goals, game stats, referrals, notifications, analytics

-- Profile extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"email_streak": true, "email_srs": true, "email_inactive": true, "email_weekly": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS streak_freezes_remaining INTEGER NOT NULL DEFAULT 1 CHECK (streak_freezes_remaining >= 0),
  ADD COLUMN IF NOT EXISTS streak_freeze_reset_at DATE,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_chapter_id TEXT REFERENCES public.chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_activity_id TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS beginner_sequencing BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Daily study sessions
CREATE TABLE IF NOT EXISTS public.daily_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_studied INTEGER NOT NULL DEFAULT 0 CHECK (minutes_studied >= 0),
  activities_completed INTEGER NOT NULL DEFAULT 0 CHECK (activities_completed >= 0),
  goal_met BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_sessions_user_date ON public.daily_sessions(user_id, session_date);

-- Game stats sync
CREATE TABLE IF NOT EXISTS public.user_game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  last_played TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_user_game_stats_user ON public.user_game_stats(user_id);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- Product analytics events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id, created_at);

-- Email engagement log (dedup)
CREATE TABLE IF NOT EXISTS public.engagement_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, email_type, sent_at)
);

-- New achievements
INSERT INTO public.achievements (id, title, description, icon, category, xp_reward, rule_key, rule_value) VALUES
  ('daily-goal-7', 'Meta 7 días', 'Cumple tu meta diaria 7 días seguidos', '🎯', 'streak', 60, 'daily_goal_streak', 7),
  ('games-5', 'Jugador versátil', 'Juega 5 tipos de juegos distintos', '🎮', 'games', 40, 'distinct_games', 5),
  ('module-complete', 'Módulo completo', 'Completa todos los capítulos de un módulo', '🏅', 'progress', 100, 'modules_completed', 1),
  ('comeback-7', 'De vuelta', 'Regresa después de 7 días de inactividad', '👋', 'streak', 50, 'comeback_days', 7)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily sessions"
  ON public.daily_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own game stats"
  ON public.user_game_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own referrals"
  ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users insert referrals as referred"
  ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

CREATE POLICY "Users insert analytics events"
  ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins read analytics"
  ON public.analytics_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users read own engagement emails"
  ON public.engagement_emails FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role engagement emails"
  ON public.engagement_emails FOR INSERT WITH CHECK (true);
