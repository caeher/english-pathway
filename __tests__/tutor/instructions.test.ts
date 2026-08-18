import { describe, expect, it } from 'vitest'
import { buildTutorInstructions } from '@/lib/tutor/instructions'

describe('buildTutorInstructions', () => {
  it('includes base CEFR instructional language policy when no learner context is provided', () => {
    const instructions = buildTutorInstructions()

    expect(instructions).toContain('Instructional language policy (CEFR-aware)')
    expect(instructions).toContain('**A1 (Beginner)**')
    expect(instructions).toContain('**A2 (Elementary)**')
    expect(instructions).toContain('**B1 (Intermediate)**')
    expect(instructions).toContain('**B2 (Upper Intermediate)**')
    expect(instructions).toContain('**C1 (Advanced)**')
    expect(instructions).toContain('**C2 (Mastery)**')
    expect(instructions).toContain('Downward Adaptation Rule')
  })

  it('includes learner context and intermediate English-first policy', () => {
    const instructions = buildTutorInstructions({
      level: 'intermediate',
      lastChapterId: 'ch-1',
      lastActivityId: 'act-1',
    })

    expect(instructions).toContain('Learner level: intermediate.')
    expect(instructions).toContain('Instructional language policy (B1 Intermediate)')
    expect(instructions).toContain('Last chapter studied: ch-1.')
    expect(instructions).toContain('Last activity completed: act-1.')
    expect(instructions).not.toContain('## Session plan')
  })

  it('sets native language and A1 policy for beginner learners', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Ana',
      level: 'A1',
      nativeLanguageLabel: 'Spanish',
      recommendedChapterId: 'm1-ch1',
      recommendedActivityId: 'm1-ch1-flashcards',
    })

    expect(instructions).toContain('Learner name: Ana.')
    expect(instructions).toContain('Learner native language: Spanish.')
    expect(instructions).toContain('Instructional language policy (A1 Beginner): Speak primarily in Spanish for greetings, lesson opening, new grammar explanations, directions, instructions, and error corrections.')
    expect(instructions).toContain('vocabulary words, short model sentences, and brief guided practice')
    expect(instructions).toContain('explain sounds, mouth position, stress, and corrections in Spanish.')
    expect(instructions).toContain('Recommended next chapter: m1-ch1.')
    expect(instructions).toContain('Recommended next activity: m1-ch1-flashcards.')
  })

  it('sets B2 predominantly English policy with scaffolding for upper intermediate learners', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Carlos',
      level: 'B2',
      nativeLanguageLabel: 'Portuguese',
    })

    expect(instructions).toContain('Learner level: B2.')
    expect(instructions).toContain('Learner native language: Portuguese.')
    expect(instructions).toContain('Instructional language policy (B2 Upper Intermediate): Predominantly English instruction.')
    expect(instructions).toContain('Provide limited Portuguese scaffolding only when strictly necessary')
    expect(instructions).toContain('Resume English immediately once clarified.')
  })

  it('sets C1 nearly-all English immersion policy for advanced learners', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Yuki',
      level: 'C1',
      nativeLanguageLabel: 'Japanese',
    })

    expect(instructions).toContain('Learner level: C1.')
    expect(instructions).toContain('Learner native language: Japanese.')
    expect(instructions).toContain('Instructional language policy (C1 Advanced): Conduct nearly all explanation, examples, feedback, and conversation in English.')
    expect(instructions).toContain('Do not use Japanese unless the learner explicitly asks')
  })

  it('sets level-adapted English policy when no native language is configured', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Sam',
      level: 'A2',
      nativeLanguageLabel: null,
    })

    expect(instructions).toContain('Instructional language policy (A2 Elementary): Use simple, clear English with basic vocabulary, guided practice')
  })
})
