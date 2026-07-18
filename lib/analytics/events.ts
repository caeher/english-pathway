export type AnalyticsEventName =
  | 'landing_cta_click'
  | 'demo_activity_complete'
  | 'demo_chapter_start'
  | 'signup_complete'
  | 'onboarding_step'
  | 'onboarding_view'
  | 'onboarding_abandon'
  | 'onboarding_skip'
  | 'onboarding_complete'
  | 'chapter_start'
  | 'chapter_complete'
  | 'activity_complete'
  | 'daily_goal_met'
  | 'streak_lost'
  | 'streak_saved'
  | 'srs_review_complete'
  | 'game_complete'
  | 'guest_signup_prompt_shown'
  | 'guest_signup_prompt_click'

export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | null | undefined
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'ie-analytics-session'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

export function trackEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsEventProperties = {}
) {
  if (typeof window === 'undefined') return

  const payload = {
    event_name: eventName,
    properties,
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  }

  // Optional PostHog forward
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (posthogKey && typeof window !== 'undefined') {
    const w = window as Window & { posthog?: { capture: (e: string, p?: object) => void } }
    w.posthog?.capture(eventName, properties)
  }

  void fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
