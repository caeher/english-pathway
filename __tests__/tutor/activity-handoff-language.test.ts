import { describe, expect, it, vi } from 'vitest'
import { getTutorSessionUseCase } from '@/features/tutor/use-cases'
import { buildOrchestrationMessage } from '@/lib/tutor/send-orchestration'
import { buildTutorInstructions } from '@/lib/tutor/instructions'
import { getActivityInstructionalLanguagePolicy } from '@/lib/learn/activity-language-policy'
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

describe('CEFR-Aware Activity Handoff & Instructional Language', () => {
  describe('Spanish A1 Activity Handoff', () => {
    it('initializes session with Spanish-first activity guidance and English target practice', async () => {
      const context = createMockContext({
        full_name: 'Mateo Garcia',
        level: 'A1',
        native_language: 'es',
      })

      const session = await getTutorSessionUseCase(context)
      expect(session.orchestration.learner).toEqual({
        level: 'A1',
        nativeLanguage: 'es',
        nativeLanguageLabel: 'Spanish',
        fullName: 'Mateo Garcia',
        dailyGoalMinutes: 15,
        preferredMode: 'voice',
      })

      const bootstrapMessage = buildOrchestrationMessage(session.orchestration)
      expect(bootstrapMessage).not.toBeNull()

      // Spoken introduction, written directions, and feedback in Spanish for A1
      expect(bootstrapMessage).toContain('Activity instructional language policy (A1 Beginner):')
      expect(bootstrapMessage).toContain('introduce the activity and deliver spoken directions, instructions, hints, error explanations, and post-activity feedback primarily in Spanish')
      expect(bootstrapMessage).toContain('set "context" (pedagogical purpose) and "expectedAction" (step-by-step direction) in Spanish')

      // Target English learning material stays 100% in English
      expect(bootstrapMessage).toContain('target English learning material itself (vocabulary words, pronunciation targets, multiple-choice options, answers, and model examples) must remain 100% in English')
    })

    it('builds system instructions enforcing Spanish A1 activity handoff and mid-activity clarification rules', () => {
      const instructions = buildTutorInstructions({
        fullName: 'Mateo Garcia',
        level: 'A1',
        nativeLanguage: 'es',
        nativeLanguageLabel: 'Spanish',
      })

      expect(instructions).toContain('Learner level: A1.')
      expect(instructions).toContain('Learner native language: Spanish.')
      expect(instructions).toContain('Activity instructional language policy (A1 Beginner):')
      expect(instructions).toContain('set "context" (pedagogical purpose) and "expectedAction" (step-by-step direction) in Spanish')
      expect(instructions).toContain('If the learner asks for clarification while the activity is open, answer concisely in the level-appropriate language without resetting or clearing the activity.')
    })
  })

  describe('Representative B1 Intermediate Transition', () => {
    it('initializes session with English-first activity instructions and native clarification scaffolding', async () => {
      const context = createMockContext({
        full_name: 'Giovanni Rossi',
        level: 'B1',
        native_language: 'it',
      })

      const session = await getTutorSessionUseCase(context)
      expect(session.orchestration.learner?.level).toBe('B1')
      expect(session.orchestration.learner?.nativeLanguageLabel).toBe('Italian')

      const bootstrapMessage = buildOrchestrationMessage(session.orchestration)
      expect(bootstrapMessage).toContain('Activity instructional language policy (B1 Intermediate):')
      expect(bootstrapMessage).toContain('Balanced transition with English as the primary activity language')
      expect(bootstrapMessage).toContain('Deliver activity introductions, directions, hints, and feedback in English')
      expect(bootstrapMessage).toContain('Set "context" and "expectedAction" in English')
      expect(bootstrapMessage).toContain('Use Italian only for targeted clarification')
    })
  })

  describe('English-Only C2 Activity Guidance', () => {
    it('initializes session with 100% English immersion throughout the activity lifecycle', async () => {
      const context = createMockContext({
        full_name: 'Claire Dupont',
        level: 'C2',
        native_language: 'fr',
      })

      const session = await getTutorSessionUseCase(context)
      expect(session.orchestration.learner?.level).toBe('C2')
      expect(session.orchestration.learner?.nativeLanguageLabel).toBe('French')

      const bootstrapMessage = buildOrchestrationMessage(session.orchestration)
      expect(bootstrapMessage).toContain('Activity instructional language policy (C2 Mastery):')
      expect(bootstrapMessage).toContain('Full English immersion throughout the entire activity lifecycle')
      expect(bootstrapMessage).toContain('Use French only if the learner explicitly requests clarification in French')
    })
  })

  describe('Mid-Activity Clarification & In-Session Assistance', () => {
    it('instructs tutor to answer learner questions without closing or resetting the activity', () => {
      const policy = getActivityInstructionalLanguagePolicy('A1', 'Spanish')
      expect(policy).toContain('provide concise scaffolding in Spanish without clearing or resetting the activity')

      const baseInstructions = buildTutorInstructions(null)
      expect(baseInstructions).toContain('If the learner asks for clarification while the activity is open, answer concisely in the level-appropriate language without resetting or clearing the activity.')
    })
  })
})
