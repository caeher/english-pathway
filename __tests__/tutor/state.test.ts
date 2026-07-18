import { describe, expect, it } from 'vitest'
import { transitionTutorState } from '@/lib/tutor/state'

describe('tutor session state machine', () => {
  it('does not skip activity evaluation without an explicit result', () => {
    expect(transitionTutorState('activity_presented', { type: 'continue' })).toBe('activity_presented')
    expect(transitionTutorState('activity_presented', { type: 'answer_requested' })).toBe('waiting_response')
    expect(transitionTutorState('waiting_response', { type: 'activity_result', scorePercent: 80 })).toBe('evaluating')
  })

  it('keeps help and abandonment explicit', () => {
    expect(transitionTutorState('waiting_response', { type: 'help_requested' })).toBe('help')
    expect(transitionTutorState('help', { type: 'continue' })).toBe('waiting_response')
    expect(transitionTutorState('help', { type: 'abandon' })).toBe('closed')
  })
})
