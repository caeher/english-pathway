export const TUTOR_ACTIVITY_PRESENTED_EVENT = 'english-pathway:tutor-activity-presented'

// The activity is shown while the tutor may still be finishing its spoken
// instruction. Keep the connection alive long enough for buffered audio to
// play and for the learner to absorb the final direction before pausing.
export const ACTIVITY_VOICE_WRAP_UP_DELAY_MS = 6_000

export function notifyTutorActivityPresented(activityId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TUTOR_ACTIVITY_PRESENTED_EVENT, { detail: { activityId } }))
}
