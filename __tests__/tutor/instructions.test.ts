import { describe, expect, it } from 'vitest'
import { buildTutorInstructions } from '@/lib/tutor/instructions'

describe('buildTutorInstructions', () => {
  it('includes base CEFR instructional language policy when no learner context is provided', () => {
    const instructions = buildTutorInstructions()

    expect(instructions).toContain('Instructional language policy (CEFR-aware)')
    expect(instructions).toContain('**A1–A2 (Beginner)**')
    expect(instructions).toContain('**B1–B2 (Intermediate)**')
    expect(instructions).toContain('**C1–C2 (Advanced)**')
    expect(instructions).toContain('Downward Adaptation Rule')
  })

  it('includes learner context and intermediate English-first policy', () => {
    const instructions = buildTutorInstructions({
      level: 'intermediate',
      lastChapterId: 'ch-1',
      lastActivityId: 'act-1',
    })

    expect(instructions).toContain('Learner level: intermediate.')
    expect(instructions).toContain('Instructional language policy (B1–B2 Intermediate)')
    expect(instructions).toContain('Last chapter studied: ch-1.')
    expect(instructions).toContain('Last activity completed: act-1.')
    expect(instructions).not.toContain('## Session plan')
  })

  it('sets native language and A1-A2 policy for beginner learners', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Ana',
      level: 'A1',
      nativeLanguageLabel: 'Spanish',
      recommendedChapterId: 'm1-ch1',
      recommendedActivityId: 'm1-ch1-flashcards',
    })

    expect(instructions).toContain('Learner name: Ana.')
    expect(instructions).toContain('Learner native language: Spanish.')
    expect(instructions).toContain('Instructional language policy (A1–A2 Beginner): Explain new grammar, directions, instructions, and error corrections primarily in Spanish.')
    expect(instructions).toContain('vocabulary words, model sentences, and interactive practice in English.')
    expect(instructions).toContain('explain sounds, mouth position, stress, and corrections in Spanish.')
    expect(instructions).toContain('Recommended next chapter: m1-ch1.')
    expect(instructions).toContain('Recommended next activity: m1-ch1-flashcards.')
  })

  it('sets B1-B2 English-first policy with scaffolding for intermediate learners', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Carlos',
      level: 'B2',
      nativeLanguageLabel: 'Portuguese',
    })

    expect(instructions).toContain('Learner level: B2.')
    expect(instructions).toContain('Learner native language: Portuguese.')
    expect(instructions).toContain('Instructional language policy (B1–B2 Intermediate): English-first instruction.')
    expect(instructions).toContain('Use Portuguese only for concise, purposeful scaffolding')
    expect(instructions).toContain('Resume English immediately once clarified.')
  })

  it('sets C1-C2 full English immersion policy for advanced learners', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Yuki',
      level: 'C1',
      nativeLanguageLabel: 'Japanese',
    })

    expect(instructions).toContain('Learner level: C1.')
    expect(instructions).toContain('Learner native language: Japanese.')
    expect(instructions).toContain('Instructional language policy (C1–C2 Advanced): Full English immersion.')
    expect(instructions).toContain('Do not use Japanese unless the learner explicitly asks')
  })

  it('sets level-adapted English policy when no native language is configured', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Sam',
      level: 'A2',
      nativeLanguageLabel: null,
    })

    expect(instructions).toContain('Instructional language policy (A1–A2 Beginner): Use simple, clear English with basic vocabulary')
  })
})
