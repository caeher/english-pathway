export const tutorSessionStates = [
  'preparing',
  'context',
  'explaining',
  'activity_presented',
  'waiting_response',
  'evaluating',
  'help',
  'reinforcing',
  'next_step',
  'closed',
] as const

export type TutorSessionState = typeof tutorSessionStates[number]

export type TutorSessionEvent =
  | { type: 'context_ready' }
  | { type: 'explanation_shown' }
  | { type: 'activity_presented' }
  | { type: 'answer_requested' }
  | { type: 'activity_result'; scorePercent: number }
  | { type: 'help_requested' }
  | { type: 'panel_cleared' }
  | { type: 'continue' }
  | { type: 'abandon' }
  | { type: 'close' }

export function transitionTutorState(state: TutorSessionState, event: TutorSessionEvent): TutorSessionState {
  if (event.type === 'abandon' || event.type === 'close') return 'closed'
  if (event.type === 'context_ready') return 'context'
  if (event.type === 'explanation_shown') return 'explaining'
  if (event.type === 'activity_presented') return 'activity_presented'
  if (event.type === 'answer_requested') return 'waiting_response'
  if (event.type === 'activity_result') return 'evaluating'
  if (event.type === 'help_requested') return 'help'
  if (event.type === 'panel_cleared') return 'next_step'
  if (event.type === 'continue') {
    if (state === 'evaluating') return 'reinforcing'
    if (state === 'help') return 'waiting_response'
    return state
  }
  return state
}
