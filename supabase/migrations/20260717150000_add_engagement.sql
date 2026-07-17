CREATE TABLE public.user_engagement (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_study_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.daily_sessions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  minutes_studied INTEGER NOT NULL DEFAULT 0 CHECK (minutes_studied >= 0),
  xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  activities_completed INTEGER NOT NULL DEFAULT 0 CHECK (activities_completed >= 0),
  goal_met BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, session_date)
);

CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  rule_key TEXT NOT NULL,
  rule_value INTEGER NOT NULL DEFAULT 1 CHECK (rule_value > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE public.engagement_activity_awards (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL CHECK (xp_awarded >= 0),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_id)
);

CREATE INDEX idx_daily_sessions_user_date ON public.daily_sessions(user_id, session_date DESC);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

INSERT INTO public.achievements (id, title, description, icon, category, xp_reward, rule_key, rule_value) VALUES
  ('first-activity', 'First steps', 'Complete your first activity.', '🎯', 'progress', 10, 'activities_completed', 1),
  ('streak-3', 'Three-day streak', 'Study English three days in a row.', '🔥', 'streak', 30, 'streak_days', 3),
  ('streak-7', 'Week streak', 'Study English seven days in a row.', '🔥', 'streak', 75, 'streak_days', 7),
  ('xp-500', '500 XP', 'Earn 500 experience points.', '⚡', 'xp', 50, 'total_xp', 500),
  ('xp-1000', '1,000 XP', 'Earn 1,000 experience points.', '💎', 'xp', 100, 'total_xp', 1000),
  ('perfect-activity', 'Perfect score', 'Complete an activity with 100%.', '🌟', 'skill', 25, 'perfect_activity', 1),
  ('activities-10', 'Practice habit', 'Complete ten activities.', '📚', 'progress', 40, 'activities_completed', 10)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_activity_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own engagement" ON public.user_engagement
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own daily sessions" ON public.daily_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Achievements are publicly readable" ON public.achievements
  FOR SELECT USING (TRUE);
CREATE POLICY "Users can view own earned achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.record_engagement_session(
  p_activity_id TEXT,
  p_xp INTEGER,
  p_minutes INTEGER,
  p_local_date DATE,
  p_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_inserted INTEGER;
  v_engagement public.user_engagement%ROWTYPE;
  v_daily public.daily_sessions%ROWTYPE;
  v_daily_goal INTEGER;
  v_new_achievements JSONB := '[]'::jsonb;
  v_achievement RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.engagement_activity_awards (user_id, activity_id, xp_awarded)
  VALUES (v_user_id, p_activity_id, GREATEST(0, p_xp))
  ON CONFLICT (user_id, activity_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    SELECT * INTO v_engagement FROM public.user_engagement WHERE user_id = v_user_id;
    SELECT * INTO v_daily FROM public.daily_sessions
      WHERE user_id = v_user_id AND session_date = p_local_date;
    RETURN jsonb_build_object(
      'xpAwarded', 0,
      'totalXp', COALESCE(v_engagement.total_xp, 0),
      'currentStreak', COALESCE(v_engagement.current_streak, 0),
      'longestStreak', COALESCE(v_engagement.longest_streak, 0),
      'dailyMinutes', COALESCE(v_daily.minutes_studied, 0),
      'dailyGoalMinutes', COALESCE((SELECT daily_goal_minutes FROM public.profiles WHERE id = v_user_id), 10),
      'newAchievementIds', '[]'::jsonb
    );
  END IF;

  INSERT INTO public.user_engagement (user_id, total_xp, current_streak, longest_streak, last_study_date)
  VALUES (v_user_id, GREATEST(0, p_xp), 1, 1, p_local_date)
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = public.user_engagement.total_xp + GREATEST(0, p_xp),
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

  SELECT * INTO v_engagement FROM public.user_engagement WHERE user_id = v_user_id;
  v_daily_goal := COALESCE((SELECT daily_goal_minutes FROM public.profiles WHERE id = v_user_id), 10);

  INSERT INTO public.daily_sessions (user_id, session_date, minutes_studied, xp_earned, activities_completed, goal_met)
  VALUES (v_user_id, p_local_date, GREATEST(0, p_minutes), GREATEST(0, p_xp), 1,
    GREATEST(0, p_minutes) >= v_daily_goal)
  ON CONFLICT (user_id, session_date) DO UPDATE SET
    minutes_studied = public.daily_sessions.minutes_studied + EXCLUDED.minutes_studied,
    xp_earned = public.daily_sessions.xp_earned + EXCLUDED.xp_earned,
    activities_completed = public.daily_sessions.activities_completed + 1,
    goal_met = public.daily_sessions.minutes_studied + EXCLUDED.minutes_studied >= v_daily_goal,
    updated_at = NOW();
  SELECT * INTO v_daily FROM public.daily_sessions
    WHERE user_id = v_user_id AND session_date = p_local_date;

  FOR v_achievement IN
    SELECT a.id
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
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (v_user_id, v_achievement.id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    v_new_achievements := v_new_achievements || jsonb_build_array(v_achievement.id);
  END LOOP;

  RETURN jsonb_build_object(
    'xpAwarded', GREATEST(0, p_xp),
    'totalXp', v_engagement.total_xp,
    'currentStreak', v_engagement.current_streak,
    'longestStreak', v_engagement.longest_streak,
    'dailyMinutes', v_daily.minutes_studied,
    'dailyGoalMinutes', v_daily_goal,
    'newAchievementIds', v_new_achievements
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_engagement_session(TEXT, INTEGER, INTEGER, DATE, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_engagement_session(TEXT, INTEGER, INTEGER, DATE, INTEGER) TO authenticated;
