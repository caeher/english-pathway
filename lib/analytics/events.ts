import { hasAnalyticsConsent } from '@/lib/consent/client'

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
  | 'learn_mode_select'
  | 'learn_microphone'
  | 'learn_session_start'
  | 'learn_session_end'
  | 'learn_session_error'
  | 'learn_tool_call'
  | 'learn_tool_error'

export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | null | undefined
}

const sensitivePropertyPattern = /(audio|answer|content|email|memory|message|prompt|summary|transcript|user)/i

export function sanitizeAnalyticsProperties(properties: AnalyticsEventProperties): AnalyticsEventProperties {
  return Object.fromEntries(Object.entries(properties).filter(([key]) => !sensitivePropertyPattern.test(key)))
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
  if (!hasAnalyticsConsent()) return

  const payload = {
    event_name: eventName,
    properties: sanitizeAnalyticsProperties(properties),
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  }

  void fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
