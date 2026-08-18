import { describe, expect, it } from 'vitest'
import { buildOrchestrationMessage } from '@/lib/tutor/send-orchestration'
import type { SessionOrchestration } from '@/components/voice/session-types'

describe('buildOrchestrationMessage', () => {
  it('returns null when orchestration is undefined', () => {
    expect(buildOrchestrationMessage(undefined)).toBeNull()
  })

  it('builds A1-A2 bootstrap message with native language greeting and instructions', () => {
    const orchestration: SessionOrchestration = {
      instruction: 'Use only validated curriculum activity IDs.',
      learner: {
        fullName: 'Elena',
        level: 'A1',
        nativeLanguage: 'es',
        nativeLanguageLabel: 'Spanish',
        dailyGoalMinutes: 15,
        preferredMode: 'voice',
      },
      progress: {
        lastChapterId: 'ch-intro',
        lastActivityId: 'act-quiz-1',
      },
      recommendation: {
        moduleId: 'mod-1',
        chapterId: 'ch-1',
        activityId: 'act-1',
      },
    }

    const message = buildOrchestrationMessage(orchestration)
    expect(message).not.toBeNull()
    expect(message).toContain('Learner name: Elena.')
    expect(message).toContain('Learner level: A1.')
    expect(message).toContain('Learner native language: Spanish.')
    expect(message).toContain('Instructional language policy (A1–A2 Beginner): Explain new grammar, directions, instructions, and error corrections primarily in Spanish.')
    expect(message).toContain('Greet me briefly in my native language (Spanish), state my level (A1), and offer the recommended topic')
    expect(message).toContain('Explain grammar, directions, and corrections in Spanish; keep pronunciation targets, vocabulary words, and practice in English.')
    expect(message).toContain('Last chapter studied: ch-intro.')
    expect(message).toContain('Recommended continuation: chapter ch-1, activity act-1.')
  })

  it('builds B1-B2 bootstrap message with English-first instruction and blocker scaffolding', () => {
    const orchestration: SessionOrchestration = {
      learner: {
        fullName: 'Lucas',
        level: 'B1',
        nativeLanguage: 'pt',
        nativeLanguageLabel: 'Portuguese',
        dailyGoalMinutes: 20,
        preferredMode: 'voice',
      },
    }

    const message = buildOrchestrationMessage(orchestration)
    expect(message).not.toBeNull()
    expect(message).toContain('Learner name: Lucas.')
    expect(message).toContain('Learner level: B1.')
    expect(message).toContain('Learner native language: Portuguese.')
    expect(message).toContain('Instructional language policy (B1–B2 Intermediate): English-first instruction.')
    expect(message).toContain('Greet me in English, state my level (B1), and offer the recommended topic')
    expect(message).toContain('Conduct the lesson English-first; use Portuguese only if I get stuck or explicitly ask for clarification.')
  })

  it('builds C1-C2 bootstrap message with full English immersion', () => {
    const orchestration: SessionOrchestration = {
      learner: {
        fullName: 'Claire',
        level: 'C2',
        nativeLanguage: 'fr',
        nativeLanguageLabel: 'French',
        dailyGoalMinutes: 30,
        preferredMode: 'voice',
      },
    }

    const message = buildOrchestrationMessage(orchestration)
    expect(message).not.toBeNull()
    expect(message).toContain('Learner name: Claire.')
    expect(message).toContain('Learner level: C2.')
    expect(message).toContain('Instructional language policy (C1–C2 Advanced): Full English immersion.')
    expect(message).toContain('Greet me in English, state my level (C2), and offer the recommended topic')
    expect(message).toContain('Maintain full English immersion throughout the lesson.')
  })

  it('builds bootstrap message when learner has no native language configured', () => {
    const orchestration: SessionOrchestration = {
      learner: {
        fullName: 'Alex',
        level: 'A2',
        nativeLanguage: null,
        nativeLanguageLabel: null,
        dailyGoalMinutes: 10,
        preferredMode: 'text',
      },
    }

    const message = buildOrchestrationMessage(orchestration)
    expect(message).not.toBeNull()
    expect(message).toContain('Learner level: A2.')
    expect(message).toContain('Instructional language policy (A1–A2 Beginner): Use simple, clear English with basic vocabulary')
    expect(message).toContain('Greet me in simple English, state my level (A2), and offer the recommended topic')
  })
})
