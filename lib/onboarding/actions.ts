'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { onboardingCompletionSchema, onboardingDraftSchema } from './schemas'

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

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at, onboarding_status, onboarding_step')
    .eq('id', user.id)
    .maybeSingle()

  const updates: {
    onboarding_completed_at: string | null
    onboarding_status: 'completed' | 'skipped'
    onboarding_step: number
    level?: typeof parsed.data.level
    daily_goal_minutes?: typeof parsed.data.dailyGoalMinutes
    preferred_mode?: 'voice' | 'text'
  } = {
    onboarding_completed_at: currentProfile?.onboarding_completed_at ?? (parsed.data.skipped ? null : new Date().toISOString()),
    onboarding_status: parsed.data.skipped && !currentProfile?.onboarding_completed_at ? 'skipped' : 'completed',
    onboarding_step: parsed.data.skipped ? (parsed.data.step ?? currentProfile?.onboarding_step ?? 0) : 4,
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

export async function saveOnboardingDraftAction(input: unknown): Promise<OnboardingActionState> {
  const parsed = onboardingDraftSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid onboarding draft.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to save onboarding progress.' }

  const updates: {
    onboarding_step: number
    level?: 'beginner' | 'intermediate' | 'advanced'
    daily_goal_minutes?: 5 | 10 | 20
    preferred_mode?: 'voice' | 'text'
  } = { onboarding_step: parsed.data.step }
  if (parsed.data.level != null) updates.level = parsed.data.level
  if (parsed.data.dailyGoalMinutes != null) updates.daily_goal_minutes = parsed.data.dailyGoalMinutes
  if (parsed.data.preferredMode != null) updates.preferred_mode = parsed.data.preferredMode

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) return { error: 'Could not save your onboarding progress.' }

  revalidatePath('/onboarding')
  revalidatePath('/settings')
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
    .select('onboarding_completed_at, onboarding_status, onboarding_step, daily_goal_minutes, level, preferred_mode')
    .eq('id', user.id)
    .maybeSingle()

  return data
}
