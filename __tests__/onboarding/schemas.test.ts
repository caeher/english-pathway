import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onboardingCompletionSchema, parseOnboardingLevel } from '@/lib/onboarding/schemas'
import { completeOnboardingAction, saveOnboardingDraftAction } from '@/lib/onboarding/actions'

const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: vi.fn(async () => null),
}))

const mockUpsert = vi.fn()
const mockSelect = vi.fn()
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
    })),
  })),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('onboarding completion validation', () => {
  it('parses CEFR and legacy onboarding levels', () => {
    expect(parseOnboardingLevel('B1')).toBe('B1')
    expect(parseOnboardingLevel('beginner')).toBe('beginner')
    expect(parseOnboardingLevel('fluent')).toBeNull()
  })

  it('accepts every supported level and daily goal', () => {
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'beginner', 'intermediate', 'advanced']) {
      for (const dailyGoalMinutes of [5, 10, 20]) {
        expect(
          onboardingCompletionSchema.safeParse({ level, dailyGoalMinutes, skipped: false }).success
        ).toBe(true)
      }
    }
  })

  it('rejects unsupported preferences and incomplete completion', () => {
    expect(
      onboardingCompletionSchema.safeParse({ level: 'fluent', dailyGoalMinutes: 15 }).success
    ).toBe(false)
    expect(
      onboardingCompletionSchema.safeParse({ level: 'beginner', skipped: false }).success
    ).toBe(false)
  })

  it('accepts skip without preferences', () => {
    expect(onboardingCompletionSchema.safeParse({ skipped: true }).success).toBe(true)
  })

  it('accepts optional native language on completion', () => {
    expect(
      onboardingCompletionSchema.safeParse({
        level: 'beginner',
        dailyGoalMinutes: 10,
        nativeLanguage: 'es',
        skipped: false,
      }).success
    ).toBe(true)
    expect(
      onboardingCompletionSchema.safeParse({
        level: 'beginner',
        dailyGoalMinutes: 10,
        nativeLanguage: null,
        skipped: false,
      }).success
    ).toBe(true)
  })

  it('rejects unsupported native language codes', () => {
    expect(
      onboardingCompletionSchema.safeParse({
        level: 'beginner',
        dailyGoalMinutes: 10,
        nativeLanguage: 'en',
        skipped: false,
      }).success
    ).toBe(false)
  })
})

describe('onboarding completion persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMaybeSingle.mockResolvedValue({ data: null })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('persists preferences and a completion timestamp for a completed wizard', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' })

    const result = await completeOnboardingAction({
      level: 'intermediate',
      dailyGoalMinutes: 10,
      skipped: false,
    })

    expect(result).toEqual({ success: true })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        level: 'intermediate',
        daily_goal_minutes: 10,
        onboarding_completed_at: expect.any(String),
        onboarding_status: 'completed',
        onboarding_step: 5,
      }),
      { onConflict: 'id' }
    )
  })

  it('persists native language when completing onboarding', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-3' })

    const result = await completeOnboardingAction({
      level: 'beginner',
      dailyGoalMinutes: 5,
      nativeLanguage: 'es',
      skipped: false,
    })

    expect(result).toEqual({ success: true })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-3',
        native_language: 'es',
        onboarding_step: 5,
      }),
      { onConflict: 'id' }
    )
  })

  it('persists native language in onboarding drafts', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-4' })

    const result = await saveOnboardingDraftAction({
      step: 4,
      nativeLanguage: 'pt',
    })

    expect(result).toEqual({ success: true })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-4',
        onboarding_step: 4,
        native_language: 'pt',
      }),
      { onConflict: 'id' }
    )
  })

  it('completes using persisted profile level when the client omits it', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-5' })
    mockMaybeSingle.mockResolvedValue({
      data: {
        level: 'B1',
        daily_goal_minutes: 10,
        preferred_mode: 'text',
        native_language: null,
        onboarding_completed_at: null,
        onboarding_status: 'pending',
        onboarding_step: 4,
      },
    })

    const result = await completeOnboardingAction({
      dailyGoalMinutes: 10,
      nativeLanguage: 'es',
      skipped: false,
    })

    expect(result).toEqual({ success: true })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-5',
        level: 'B1',
        daily_goal_minutes: 10,
        native_language: 'es',
        onboarding_step: 5,
      }),
      { onConflict: 'id' }
    )
  })

  it('persists completion when the user skips', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-2' })

    const result = await completeOnboardingAction({ skipped: true })

    expect(result).toEqual({ success: true })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-2',
        onboarding_completed_at: null,
        onboarding_status: 'skipped',
        onboarding_step: 0,
      }),
      { onConflict: 'id' }
    )
  })
})
