'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  dailyGoalMinutesSchema,
  onboardingCompletionSchema,
  onboardingDraftSchema,
  parseOnboardingLevel,
  preferredModeSchema,
} from './schemas'
import { isNativeLanguageCode } from '@/lib/languages/native-languages'

export type OnboardingActionState = {
  error?: string
  success?: boolean
}

export async function completeOnboardingAction(
  input: unknown
): Promise<OnboardingActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to complete onboarding.' }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select(
      'onboarding_completed_at, onboarding_status, onboarding_step, level, daily_goal_minutes, preferred_mode, native_language'
    )
    .eq('id', user.id)
    .maybeSingle()

  const rawInput =
    typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const parsedDailyGoal = dailyGoalMinutesSchema.safeParse(currentProfile?.daily_goal_minutes)
  const parsedPreferredMode = preferredModeSchema.safeParse(currentProfile?.preferred_mode)
  const parsedNativeLanguage =
    currentProfile?.native_language && isNativeLanguageCode(currentProfile.native_language)
      ? currentProfile.native_language
      : undefined

  const mergedInput = {
    ...rawInput,
    level: rawInput.level ?? parseOnboardingLevel(currentProfile?.level) ?? undefined,
    dailyGoalMinutes: rawInput.dailyGoalMinutes ?? (parsedDailyGoal.success ? parsedDailyGoal.data : undefined),
    preferredMode: rawInput.preferredMode ?? (parsedPreferredMode.success ? parsedPreferredMode.data : undefined),
    nativeLanguage: rawInput.nativeLanguage ?? parsedNativeLanguage,
  }

  const parsed = onboardingCompletionSchema.safeParse(mergedInput)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid onboarding data.' }
  }

  const updates: {
    onboarding_completed_at: string | null
    onboarding_status: 'completed' | 'skipped'
    onboarding_step: number
    level?: typeof parsed.data.level
    daily_goal_minutes?: typeof parsed.data.dailyGoalMinutes
    preferred_mode?: 'voice' | 'text'
    native_language?: string | null
  } = {
    onboarding_completed_at: currentProfile?.onboarding_completed_at ?? (parsed.data.skipped ? null : new Date().toISOString()),
    onboarding_status: parsed.data.skipped && !currentProfile?.onboarding_completed_at ? 'skipped' : 'completed',
    onboarding_step: parsed.data.skipped ? (parsed.data.step ?? currentProfile?.onboarding_step ?? 0) : 5,
  }

  // Leaving these fields untouched when they are omitted lets a user skip a
  // review without losing preferences they already saved.
  if (parsed.data.level !== undefined) updates.level = parsed.data.level
  if (parsed.data.dailyGoalMinutes !== undefined) {
    updates.daily_goal_minutes = parsed.data.dailyGoalMinutes
  }
  if (parsed.data.preferredMode != null) updates.preferred_mode = parsed.data.preferredMode
  if (parsed.data.nativeLanguage !== undefined) updates.native_language = parsed.data.nativeLanguage ?? null

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
    level?: import('./schemas').OnboardingLevel
    daily_goal_minutes?: 5 | 10 | 20
    preferred_mode?: 'voice' | 'text'
    native_language?: string | null
  } = { onboarding_step: parsed.data.step }
  if (parsed.data.level != null) updates.level = parsed.data.level
  if (parsed.data.dailyGoalMinutes != null) updates.daily_goal_minutes = parsed.data.dailyGoalMinutes
  if (parsed.data.preferredMode != null) updates.preferred_mode = parsed.data.preferredMode
  if (parsed.data.nativeLanguage !== undefined) updates.native_language = parsed.data.nativeLanguage ?? null

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
    .select('onboarding_completed_at, onboarding_status, onboarding_step, daily_goal_minutes, level, preferred_mode, native_language')
    .eq('id', user.id)
    .maybeSingle()

  return data
}
