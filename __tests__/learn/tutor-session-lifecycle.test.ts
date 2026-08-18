import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { transitionTutorState, type TutorSessionState } from '@/lib/tutor/state'
import { executeTutorTool } from '@/lib/learn/execute-tutor-tool'
import { useLearnSessionStore } from '@/stores/useLearnSessionStore'

const root = resolve(process.cwd())

describe('Tutor session lifecycle and non-terminal waiting states', () => {
  it('keeps waiting states non-terminal across multiple interactive lesson turns', () => {
    let state: TutorSessionState = 'preparing'

    // Initial load
    state = transitionTutorState(state, { type: 'context_ready' })
    expect(state).toBe('context')

    // Tutor explains concept
    state = transitionTutorState(state, { type: 'explanation_shown' })
    expect(state).toBe('explaining')

    // Direct activity presentation during explanation is rejected (state stays explaining)
    expect(transitionTutorState(state, { type: 'activity_presented' })).toBe('explaining')

    // Explanation is concluded / panel cleared
    state = transitionTutorState(state, { type: 'panel_cleared' })
    expect(state).toBe('next_step')

    // Tutor presents an interactive activity
    state = transitionTutorState(state, { type: 'activity_presented' })
    expect(state).toBe('activity_presented')

    // Tutor asks a question / awaits response
    state = transitionTutorState(state, { type: 'answer_requested' })
    expect(state).toBe('waiting_response')

    // Learner asks for help / hint
    state = transitionTutorState(state, { type: 'help_requested' })
    expect(state).toBe('help')

    // Hint acknowledged, returns to waiting for response
    state = transitionTutorState(state, { type: 'continue' })
    expect(state).toBe('waiting_response')

    // Learner completes activity with result
    state = transitionTutorState(state, { type: 'activity_result', scorePercent: 100 })
    expect(state).toBe('evaluating')

    // Feedback acknowledged, continue to reinforcement
    state = transitionTutorState(state, { type: 'continue' })
    expect(state).toBe('reinforcing')

    // Next activity presented
    state = transitionTutorState(state, { type: 'activity_presented' })
    expect(state).toBe('activity_presented')

    // Only explicit close or abandon moves to closed
    state = transitionTutorState(state, { type: 'close' })
    expect(state).toBe('closed')
  })

  it('executes showQuestion and showActivity without triggering session termination', async () => {
    useLearnSessionStore.getState().resetSession()

    const questionResult = await executeTutorTool('showQuestion', {
      prompt: 'Which word is a noun?',
      options: ['Run', 'Apple', 'Quickly'],
      correctIndex: 1,
    })

    expect(questionResult).toContain('Question displayed')
    const stateAfterQuestion = useLearnSessionStore.getState()
    expect(stateAfterQuestion.tutorState).toBe('waiting_response')
    expect(stateAfterQuestion.panel.kind).toBe('question')

    const grammarResult = await executeTutorTool('showGrammar', {
      title: 'Nouns Introduction',
      blocks: [{ type: 'paragraph', text: 'A noun is a person, place, or thing.' }],
    })

    expect(grammarResult).toContain('Grammar content displayed')
    const stateAfterGrammar = useLearnSessionStore.getState()
    expect(stateAfterGrammar.tutorState).toBe('explaining')
    expect(stateAfterGrammar.panel.kind).toBe('explanation')
  })

  it('transitions state correctly for activity outcome events (completed, skipped, closed)', () => {
    let state: TutorSessionState = 'activity_presented'

    // Completed with score
    state = transitionTutorState(state, { type: 'activity_outcome', status: 'completed', scorePercent: 85 })
    expect(state).toBe('evaluating')

    // Reinforce and present next activity
    state = transitionTutorState(state, { type: 'continue' })
    expect(state).toBe('reinforcing')

    state = transitionTutorState(state, { type: 'activity_presented' })
    expect(state).toBe('activity_presented')

    // Skipped
    state = transitionTutorState(state, { type: 'activity_outcome', status: 'skipped' })
    expect(state).toBe('next_step')

    state = transitionTutorState(state, { type: 'activity_presented' })
    expect(state).toBe('activity_presented')

    // Closed
    state = transitionTutorState(state, { type: 'activity_outcome', status: 'closed' })
    expect(state).toBe('next_step')
  })

  it('verifies VoiceTutorProvider and OpenAiRealtimeTutorProvider do not contain premature teardown timers', () => {
    const voiceProvider = readFileSync(resolve(root, 'components/voice/VoiceTutorProvider.tsx'), 'utf8')
    const openAiProvider = readFileSync(resolve(root, 'components/voice/OpenAiRealtimeTutorProvider.tsx'), 'utf8')
    const tutorSessionHook = readFileSync(resolve(root, 'components/voice/hooks/useTutorSession.ts'), 'utf8')

    // Disconnect timers must be absent
    expect(voiceProvider).not.toContain('activityPauseTimerRef')
    expect(voiceProvider).not.toContain('pausedForActivityRef')
    expect(openAiProvider).not.toContain('activityPauseReady')
    expect(openAiProvider).not.toContain('pauseAfterActivityInstructionRef')

    // Error and explicit end handling must be present
    expect(tutorSessionHook).toContain('isExplicitEndRef')
    expect(tutorSessionHook).toContain('handleConversationDisconnect')
    expect(tutorSessionHook).toContain('handleConversationError')
    expect(openAiProvider).toContain('isExplicitEndRef')
    expect(openAiProvider).toContain('The voice connection was lost.')
  })
})
