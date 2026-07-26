export const TUTOR_ACTIVITY_PRESENTED_EVENT = 'english-pathway:tutor-activity-presented'

export function notifyTutorActivityPresented(activityId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TUTOR_ACTIVITY_PRESENTED_EVENT, { detail: { activityId } }))
}
