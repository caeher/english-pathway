import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onboardingCompletionSchema } from '@/lib/onboarding/schemas'
import { createClient } from '@/lib/supabase/server'
import { completeOnboardingAction } from '@/lib/onboarding/actions'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const createClientMock = vi.mocked(createClient)

describe('onboarding completion validation', () => {
  it('accepts every supported level and daily goal', () => {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
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
})

describe('onboarding completion persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists preferences and a completion timestamp for a completed wizard', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    const maybeSingle = vi.fn().mockResolvedValue({ data: null })
    const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) })
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockReturnValue({ select, update }),
    } as never)

    const result = await completeOnboardingAction({
      level: 'intermediate',
      dailyGoalMinutes: 10,
      skipped: false,
    })

    expect(result).toEqual({ success: true })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'intermediate',
        daily_goal_minutes: 10,
        onboarding_completed_at: expect.any(String),
        onboarding_status: 'completed',
        onboarding_step: 4,
      })
    )
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('persists completion when the user skips', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    const maybeSingle = vi.fn().mockResolvedValue({ data: null })
    const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) })
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-2' } } }) },
      from: vi.fn().mockReturnValue({ select, update }),
    } as never)

    const result = await completeOnboardingAction({ skipped: true })

    expect(result).toEqual({ success: true })
    expect(update).toHaveBeenCalledWith({ onboarding_completed_at: null, onboarding_status: 'skipped', onboarding_step: 0 })
  })
})
