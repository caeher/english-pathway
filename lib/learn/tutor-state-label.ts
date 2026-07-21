import type { TutorSessionState } from '@/lib/tutor/state'

const TUTOR_STATE_LABELS: Partial<Record<TutorSessionState, string>> = {
  explaining: 'Explaining',
  activity_presented: 'Practice',
  waiting_response: 'Quick check',
  evaluating: 'Review',
  help: 'Help',
  reinforcing: 'Reinforcing',
  next_step: 'Next step',
}

export function getTutorStateLabel(state: TutorSessionState): string | null {
  return TUTOR_STATE_LABELS[state] ?? null
}
