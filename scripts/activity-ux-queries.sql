-- Reference queries for activity UX metrics in analytics_events.
-- Run with service-role access only; never export learner-identifying rows.

-- Completion rate by activity type (last 30 days)
SELECT
  properties->>'activity_type' AS activity_type,
  COUNT(*) FILTER (WHERE event_name = 'activity_started') AS starts,
  COUNT(*) FILTER (WHERE event_name = 'activity_complete') AS completions,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event_name = 'activity_complete')
    / NULLIF(COUNT(*) FILTER (WHERE event_name = 'activity_started'), 0),
    1
  ) AS completion_rate_pct
FROM public.analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND event_name IN ('activity_started', 'activity_complete')
GROUP BY 1
ORDER BY starts DESC;

-- First-attempt accuracy by chapter
SELECT
  properties->>'chapter_id' AS chapter_id,
  properties->>'activity_type' AS activity_type,
  COUNT(*) FILTER (
    WHERE event_name = 'activity_first_attempt'
      AND (properties->>'correct')::boolean IS TRUE
  ) AS first_correct,
  COUNT(*) FILTER (WHERE event_name = 'activity_first_attempt') AS first_attempts,
  ROUND(
    100.0 * COUNT(*) FILTER (
      WHERE event_name = 'activity_first_attempt'
        AND (properties->>'correct')::boolean IS TRUE
    ) / NULLIF(COUNT(*) FILTER (WHERE event_name = 'activity_first_attempt'), 0),
    1
  ) AS first_attempt_accuracy_pct
FROM public.analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND event_name = 'activity_first_attempt'
GROUP BY 1, 2
ORDER BY first_attempts DESC;

-- Retries and abandonment by type
SELECT
  properties->>'activity_type' AS activity_type,
  COUNT(*) FILTER (WHERE event_name = 'activity_retry') AS retries,
  COUNT(*) FILTER (WHERE event_name = 'activity_abandon') AS abandons,
  COUNT(*) FILTER (WHERE event_name = 'hint_requested') AS hints
FROM public.analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND event_name IN ('activity_retry', 'activity_abandon', 'hint_requested')
GROUP BY 1
ORDER BY retries DESC;
