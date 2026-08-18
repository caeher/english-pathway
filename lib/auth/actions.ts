'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureUserProfile } from '@/lib/auth/clerk-sync'
import { recordUserConsents } from '@/lib/auth/consent'
import { settingsSchema } from '@/lib/auth/schemas'
import type { SettingsFormValues } from '@/lib/auth/schemas'
import { savePrivateTutorMemory } from '@/lib/dal/tutor-memory'
import type { OAuthProvider } from '@/lib/auth/oauth-providers'

export type AuthActionState = {
  status?: 'error' | 'success' | 'needs_email_confirmation'
  error?: string
  success?: string
}

export interface AppUser {
  id: string
  email: string | null
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  username?: string | null
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  let user = null
  try {
    user = await currentUser()
  } catch (err) {
    console.warn('[auth] Unable to fetch currentUser:', err)
  }

  if (!user) {
    return {
      id: userId,
      email: null,
      firstName: null,
      lastName: null,
      imageUrl: null,
      username: null,
    }
  }

  const email = user.emailAddresses[0]?.emailAddress ?? null
  return {
    id: user.id,
    email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    username: user.username,
  }
}

export async function getCurrentProfile() {
  const { userId } = await auth()
  if (!userId) return null
  return ensureUserProfile(userId)
}

export type SettingsActionState = {
  error?: string
  success?: boolean
}

export async function updateSettingsAction(
  data: SettingsFormValues
): Promise<SettingsActionState> {
  const parsed = settingsSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const { userId } = await auth()
  if (!userId) return { error: 'You must be signed in.' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      daily_goal_minutes: parsed.data.dailyGoalMinutes,
      preferred_mode: parsed.data.preferredMode,
      native_language: parsed.data.nativeLanguage ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { error: 'Could not save settings.' }

  try {
    await savePrivateTutorMemory(supabase, userId, {
      type: 'learner_memory',
      memoryKey: 'preference:mode',
      content: `Preferred tutor mode is ${parsed.data.preferredMode}. Daily practice goal is ${parsed.data.dailyGoalMinutes} minutes.`,
      source: 'preference_update',
    })
  } catch (memoryError) {
    console.error('[settings] private preference memory update failed', memoryError)
  }

  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return { success: true }
}

export type LegalReconsentActionState = {
  error?: string
  success?: boolean
}

export async function acceptUpdatedLegalDocumentsAction(): Promise<LegalReconsentActionState> {
  const { userId } = await auth()
  if (!userId) return { error: 'You must be signed in.' }

  await recordUserConsents(userId, 'explicit_reconsent')
  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signOutAction() {
  redirect('/sign-in')
}

export async function signInAction(
  _prevState: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  redirect('/sign-in')
}

export async function signUpAction(
  _prevState: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  redirect('/sign-up')
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  redirect('/sign-in')
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  _formData: FormData
): Promise<AuthActionState> {
  redirect('/sign-in')
}

export async function signInWithOAuthAction(
  _provider: OAuthProvider,
  _redirectTo?: string | null
) {
  redirect('/sign-in')
}

export async function signUpWithOAuthAction(
  _provider: OAuthProvider,
  _redirectTo: string | null | undefined,
  _acceptTerms: boolean,
) {
  redirect('/sign-up')
}
