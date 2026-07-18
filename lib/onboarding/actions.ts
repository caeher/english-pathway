'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { onboardingCompletionSchema } from './schemas'

export type OnboardingActionState = {
  error?: string
  success?: boolean
}

export async function completeOnboardingAction(
  input: unknown
): Promise<OnboardingActionState> {
  const parsed = onboardingCompletionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid onboarding data.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to complete onboarding.' }

  const updates: {
    onboarding_completed_at: string
    level?: typeof parsed.data.level
    daily_goal_minutes?: typeof parsed.data.dailyGoalMinutes
    preferred_mode?: 'voice' | 'text'
  } = {
    onboarding_completed_at: new Date().toISOString(),
  }

  // Leaving these fields untouched when they are omitted lets a user skip a
  // review without losing preferences they already saved.
  if (parsed.data.level !== undefined) updates.level = parsed.data.level
  if (parsed.data.dailyGoalMinutes !== undefined) {
    updates.daily_goal_minutes = parsed.data.dailyGoalMinutes
  }
  if (parsed.data.preferredMode != null) updates.preferred_mode = parsed.data.preferredMode

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) return { error: 'Could not save your onboarding preferences.' }

  revalidatePath('/learn')
  revalidatePath('/settings')
  revalidatePath('/onboarding')
  return { success: true }
}

export async function getOnboardingProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed_at, daily_goal_minutes, level, preferred_mode')
    .eq('id', user.id)
    .maybeSingle()

  return data
}
