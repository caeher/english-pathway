import { describe, expect, it } from 'vitest'
import { buildOrchestrationMessage } from '@/lib/tutor/send-orchestration'
import type { SessionOrchestration } from '@/components/voice/session-types'

describe('buildOrchestrationMessage', () => {
  it('returns null when orchestration is undefined', () => {
    expect(buildOrchestrationMessage(undefined)).toBeNull()
  })

  it('builds A1 bootstrap message with Spanish-first greeting, explanations, and instructions', () => {
    const orchestration: SessionOrchestration = {
      instruction: 'Use only validated curriculum activity IDs. Follow the CEFR instructional language policy for explanations, directions, and feedback, and wait for an explicit activity result before advancing.',
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
    expect(message).toContain('Instructional language policy (A1 Beginner): Speak primarily in Spanish for greetings, lesson opening, new grammar explanations, directions, instructions, and error corrections.')
    expect(message).toContain('vocabulary words, short model sentences, and brief guided practice')
    expect(message).toContain('Greet me warmly in my native language (Spanish), state my level (A1), and introduce the recommended topic or ask for my interest in Spanish.')
    expect(message).toContain('Deliver explanations, instructions, and corrections primarily in Spanish; keep pronunciation targets, vocabulary words, and short model examples in English.')
    expect(message).toContain('Last chapter studied: ch-intro.')
    expect(message).toContain('Recommended continuation: chapter ch-1, activity act-1.')
  })

  it('builds A2 bootstrap message with mostly-Spanish explanations and guided English', () => {
    const orchestration: SessionOrchestration = {
      learner: {
        fullName: 'Mateo',
        level: 'A2',
        nativeLanguage: 'es',
        nativeLanguageLabel: 'Spanish',
      },
    }

    const message = buildOrchestrationMessage(orchestration)
    expect(message).not.toBeNull()
    expect(message).toContain('Learner level: A2.')
    expect(message).toContain('Instructional language policy (A2 Elementary): Speak mostly in Spanish for explanations, instructions, and error corrections, accompanied by a larger amount of guided English phrases and vocabulary.')
    expect(message).toContain('Greet me in my native language (Spanish), state my level (A2), and introduce the topic in Spanish with simple guided English phrases.')
    expect(message).toContain('Deliver explanations mostly in Spanish with guided English practice.')
  })

  it('builds B1 bootstrap message with English-first practice and targeted clarification scaffolding', () => {
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
    expect(message).toContain('Instructional language policy (B1 Intermediate): Balanced transition with English as the main practice and conversational language.')
    expect(message).toContain('Greet me in English, state my level (B1), and offer the recommended topic or ask for an interest in English.')
    expect(message).toContain('Conduct the lesson English-first as the main practice language; use Portuguese only for targeted clarification if needed.')
  })

  it('builds B2 bootstrap message with predominantly English instruction', () => {
    const orchestration: SessionOrchestration = {
      learner: {
        fullName: 'Camila',
        level: 'B2',
        nativeLanguage: 'pt',
        nativeLanguageLabel: 'Portuguese',
      },
    }

    const message = buildOrchestrationMessage(orchestration)
    expect(message).not.toBeNull()
    expect(message).toContain('Learner level: B2.')
    expect(message).toContain('Instructional language policy (B2 Upper Intermediate): Predominantly English instruction.')
    expect(message).toContain('Greet me in English, state my level (B2), and offer the recommended topic or ask for an interest in English.')
    expect(message).toContain('Teach predominantly in English; use Portuguese only for limited scaffolding when strictly necessary.')
  })

  it('builds C1 bootstrap message with nearly-all English immersion', () => {
    const orchestration: SessionOrchestration = {
      learner: {
        fullName: 'Julien',
        level: 'C1',
        nativeLanguage: 'fr',
        nativeLanguageLabel: 'French',
      },
    }

    const message = buildOrchestrationMessage(orchestration)
    expect(message).not.toBeNull()
    expect(message).toContain('Learner level: C1.')
    expect(message).toContain('Instructional language policy (C1 Advanced): Conduct nearly all explanation, examples, feedback, and conversation in English.')
    expect(message).toContain('Greet me in English, state my level (C1), and offer the recommended topic or ask for an interest in English.')
    expect(message).toContain('Conduct nearly all explanations, examples, and conversation in English; use French only if I explicitly ask for clarification.')
  })

  it('builds C2 bootstrap message with full English immersion', () => {
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
    expect(message).toContain('Instructional language policy (C2 Mastery): Full English immersion throughout the entire lesson')
    expect(message).toContain('Greet me in English, state my level (C2), and offer the recommended topic or ask for an interest in English.')
    expect(message).toContain('Maintain full English immersion throughout the lesson unless I explicitly ask for clarification in French.')
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
    expect(message).toContain('Instructional language policy (A2 Elementary): Use simple, clear English with basic vocabulary, guided practice')
    expect(message).toContain('Greet me in clear, simple English, state my level (A2), and offer the recommended topic or ask for an interest with step-by-step guidance.')
  })
})
