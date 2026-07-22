-- XP is awarded once for each distinct activity, while an activity completed on
-- a later local day still counts as learning activity for the streak and goal.
CREATE TABLE public.engagement_activity_sessions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  session_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_id, session_date)
);

CREATE INDEX idx_engagement_activity_sessions_user_date
  ON public.engagement_activity_sessions(user_id, session_date DESC);

ALTER TABLE public.engagement_activity_sessions ENABLE ROW LEVEL SECURITY;

-- Preserve retry idempotency for activity awards that predate this ledger.
-- `awarded_at` is the best available date for historic rows; new rows always
-- use the learner-local `session_date` supplied through the validated API.
INSERT INTO public.engagement_activity_sessions (user_id, activity_id, session_date, completed_at)
SELECT user_id, activity_id, awarded_at::DATE, awarded_at
FROM public.engagement_activity_awards
ON CONFLICT (user_id, activity_id, session_date) DO NOTHING;

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

  -- This ledger has one row per activity for lifetime XP idempotency.
  INSERT INTO public.engagement_activity_awards (user_id, activity_id, xp_awarded)
  VALUES (v_user_id, p_activity_id, v_activity_xp)
  ON CONFLICT (user_id, activity_id) DO NOTHING;
  GET DIAGNOSTICS v_activity_award_inserted = ROW_COUNT;
  IF v_activity_award_inserted = 1 THEN
    v_awarded_activity_xp := v_activity_xp;
  END IF;

  -- This independent ledger is one row per local day. A retry on the same day
  -- cannot change counters, but a legitimate repeat tomorrow keeps the streak.
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

REVOKE ALL ON FUNCTION public.record_engagement_session(TEXT, INTEGER, INTEGER, DATE, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_engagement_session(TEXT, INTEGER, INTEGER, DATE, INTEGER) TO authenticated;
