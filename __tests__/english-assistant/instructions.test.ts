import { describe, expect, it } from 'vitest'
import { buildEnglishAssistantInstructions } from '@/lib/english-assistant/instructions'
import { PROMPT_INJECTION_POLICY } from '@/lib/security/prompt-trust'
import type { ActivityContext } from '@/lib/english-assistant/context'

const activityContext: ActivityContext = {
  activityId: 'activity-1',
  chapterId: 'chapter-1',
  moduleId: 'module-1',
  type: 'quiz',
  title: 'Present simple',
  instructions: 'Choose the correct verb form.',
}

describe('buildEnglishAssistantInstructions', () => {
  it('includes base instructions and injection policy', () => {
    const instructions = buildEnglishAssistantInstructions()
    expect(instructions).toContain('English-learning assistant for English Pathway')
    expect(instructions).toContain(PROMPT_INJECTION_POLICY)
  })

  it.each([
    ['beginner', 'simple vocabulary, short sentences'],
    ['intermediate', 'everyday vocabulary and moderate explanations'],
    ['advanced', 'richer vocabulary and nuanced grammar explanations'],
  ] as const)('includes level-specific guidance for %s', (level, snippet) => {
    const instructions = buildEnglishAssistantInstructions(null, { level })
    expect(instructions).toContain(snippet)
  })

  it('uses neutral guidance when learner level is missing', () => {
    const instructions = buildEnglishAssistantInstructions(null, { level: null })
    expect(instructions).toContain('Assume a moderate difficulty')
    expect(instructions).not.toContain('Learner level:')
  })

  it('includes privacy guidance and forbids revealing profile attributes', () => {
    const instructions = buildEnglishAssistantInstructions(null, { level: 'beginner' })
    expect(instructions).toContain('Never tell the learner you know their level')
    expect(instructions).not.toContain('beginner')
  })

  it('wraps activity context as untrusted reference data', () => {
    const instructions = buildEnglishAssistantInstructions(activityContext, { level: 'intermediate' })
    expect(instructions).toContain('<<<untrusted_activity_context>>>')
    expect(instructions).toContain('<<<end_activity_context>>>')
    expect(instructions).toContain('Present simple')
  })
})
