import { describe, expect, it, vi } from 'vitest'
import { getTutorSessionUseCase } from '@/features/tutor/use-cases'
import { buildOrchestrationMessage } from '@/lib/tutor/send-orchestration'
import { buildTutorInstructions } from '@/lib/tutor/instructions'
import type { AuthenticatedContext } from '@/lib/api/context'

function createMockContext(profile: { full_name: string; level: string; native_language: string | null }): AuthenticatedContext {
  return {
    userId: 'test-user-id',
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    full_name: profile.full_name,
                    level: profile.level,
                    native_language: profile.native_language,
                    daily_goal_minutes: 15,
                    preferred_mode: 'voice',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    last_chapter_id: 'ch-intro',
                    last_activity_id: 'act-1',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }),
    } as unknown as AuthenticatedContext['supabase'],
  }
}

describe('Progressive Instructional Language Session', () => {
  describe('Spanish A1 Startup Regression', () => {
    it('initializes real-time session with Spanish-first greeting and instructional scaffolding', async () => {
      const context = createMockContext({
        full_name: 'Sofia Martinez',
        level: 'A1',
        native_language: 'es',
      })

      const session = await getTutorSessionUseCase(context)
      expect(session.orchestration).toBeDefined()
      expect(session.orchestration.learner).toEqual({
        level: 'A1',
        nativeLanguage: 'es',
        nativeLanguageLabel: 'Spanish',
        fullName: 'Sofia Martinez',
        dailyGoalMinutes: 15,
        preferredMode: 'voice',
      })

      const bootstrapMessage = buildOrchestrationMessage(session.orchestration)
      expect(bootstrapMessage).not.toBeNull()

      // Opening greeting and topic selection directive must be in Spanish, not hardcoded English
      expect(bootstrapMessage).toContain('Greet me warmly in my native language (Spanish), state my level (A1), and introduce the recommended topic or ask for my interest in Spanish.')
      expect(bootstrapMessage).not.toContain('Greet me in English')

      // Explanations, directions, and corrections must be primarily in Spanish
      expect(bootstrapMessage).toContain('Deliver explanations, instructions, and corrections primarily in Spanish; keep pronunciation targets, vocabulary words, and short model examples in English.')
      expect(bootstrapMessage).toContain('Instructional language policy (A1 Beginner): Speak primarily in Spanish for greetings, lesson opening, new grammar explanations, directions, instructions, and error corrections.')

      // English targets are retained for pronunciation, vocabulary, model sentences
      expect(bootstrapMessage).toContain('vocabulary words, short model sentences, and brief guided practice')
    })

    it('builds system instructions reflecting Spanish A1 scaffolding and English practice targets', () => {
      const instructions = buildTutorInstructions({
        fullName: 'Sofia Martinez',
        level: 'A1',
        nativeLanguage: 'es',
        nativeLanguageLabel: 'Spanish',
      })

      expect(instructions).toContain('Learner level: A1.')
      expect(instructions).toContain('Learner native language: Spanish.')
      expect(instructions).toContain('Instructional language policy (A1 Beginner): Speak primarily in Spanish for greetings, lesson opening, new grammar explanations, directions, instructions, and error corrections.')
      expect(instructions).toContain('Pronounce English targets naturally, then explain sounds, mouth position, stress, and corrections in Spanish.')
    })
  })

  describe('Representative B1 Intermediate Configuration', () => {
    it('initializes session with English-first practice and targeted native language clarification', async () => {
      const context = createMockContext({
        full_name: 'Mateo Rossi',
        level: 'B1',
        native_language: 'it',
      })

      const session = await getTutorSessionUseCase(context)
      expect(session.orchestration.learner?.level).toBe('B1')
      expect(session.orchestration.learner?.nativeLanguageLabel).toBe('Italian')

      const bootstrapMessage = buildOrchestrationMessage(session.orchestration)
      expect(bootstrapMessage).toContain('Greet me in English, state my level (B1), and offer the recommended topic or ask for an interest in English.')
      expect(bootstrapMessage).toContain('Conduct the lesson English-first as the main practice language; use Italian only for targeted clarification if needed.')
      expect(bootstrapMessage).toContain('Instructional language policy (B1 Intermediate): Balanced transition with English as the main practice and conversational language.')
    })
  })

  describe('Representative C2 Advanced Immersion Configuration', () => {
    it('initializes session with full English immersion unless clarification is explicitly requested', async () => {
      const context = createMockContext({
        full_name: 'Camille Dubois',
        level: 'C2',
        native_language: 'fr',
      })

      const session = await getTutorSessionUseCase(context)
      expect(session.orchestration.learner?.level).toBe('C2')
      expect(session.orchestration.learner?.nativeLanguageLabel).toBe('French')

      const bootstrapMessage = buildOrchestrationMessage(session.orchestration)
      expect(bootstrapMessage).toContain('Greet me in English, state my level (C2), and offer the recommended topic or ask for an interest in English.')
      expect(bootstrapMessage).toContain('Maintain full English immersion throughout the lesson unless I explicitly ask for clarification in French.')
      expect(bootstrapMessage).toContain('Instructional language policy (C2 Mastery): Full English immersion throughout the entire lesson for all explanations, feedback, and conversation.')
    })
  })
})
