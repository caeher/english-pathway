'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/auth/oauth-providers'
import type { OAuthProvider } from '@/lib/auth/oauth-providers'
import {
  getExplicitRedirectParam,
  resolvePostAuthDestination,
} from '@/lib/auth/resolve-redirect'
import { recordUserConsents } from '@/lib/auth/consent'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  settingsSchema,
} from '@/lib/auth/schemas'
import type { SettingsFormValues } from '@/lib/auth/schemas'

export type AuthActionState = {
  status?: 'error' | 'success' | 'needs_email_confirmation'
  error?: string
  success?: string
}

const GENERIC_AUTH_ERROR = 'Authentication could not be completed. Please try again.'

function getSafeAuthError(fallback = GENERIC_AUTH_ERROR): string {
  return fallback
}

async function hasCompletedOnboarding(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle()

  return Boolean(data?.onboarding_completed_at)
}

async function getDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  redirectTo: string | null,
): Promise<string> {
  return resolvePostAuthDestination(
    redirectTo,
    await hasCompletedOnboarding(supabase, userId),
  )
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { status: 'error', error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const { email, password } = parsed.data
  const explicitRedirectTo = getExplicitRedirectParam(
    formData.get('redirectTo') as string | null
  )

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { status: 'error', error: 'Invalid credentials. Check your email and password.' }
  }

  revalidatePath('/', 'layout')
  redirect(await getDestination(supabase, data.user.id, explicitRedirectTo))
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    acceptTerms: formData.get('acceptTerms') === 'on',
  })
  if (!parsed.success) {
    return { status: 'error', error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const { email, password, fullName } = parsed.data
  const explicitRedirectTo = getExplicitRedirectParam(
    formData.get('redirectTo') as string | null
  )
  const callbackNext = explicitRedirectTo
    ? `?next=${encodeURIComponent(explicitRedirectTo)}`
    : ''

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, accepted_terms: true },
      emailRedirectTo: `${getAppUrl()}/auth/callback${callbackNext}`,
    },
  })

  if (error) {
    console.error('[auth] sign up failed', error)
    return { status: 'error', error: getSafeAuthError('Could not create your account. Please try again.') }
  }

  if (data.user && data.session) {
    await recordUserConsents(data.user.id)

    revalidatePath('/', 'layout')
    redirect(await getDestination(supabase, data.user.id, explicitRedirectTo))
  }

  return {
    status: 'needs_email_confirmation',
    success: 'Account created. Check your email to confirm your account.',
  }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { status: 'error', error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const explicitRedirectTo = getExplicitRedirectParam(
    formData.get('redirectTo') as string | null
  )
  const callbackParams = new URLSearchParams({ next: '/reset-password' })
  if (explicitRedirectTo) callbackParams.set('redirectTo', explicitRedirectTo)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/auth/callback?${callbackParams.toString()}`,
  })

  if (error) {
    console.error('[auth] password reset request failed', error)
    return { status: 'error', error: getSafeAuthError('Could not send the reset link. Please try again.') }
  }

  return { status: 'success', success: 'If an account matches that email, we sent a password reset link.' }
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) {
    return { status: 'error', error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const explicitRedirectTo = getExplicitRedirectParam(
    formData.get('redirectTo') as string | null
  )

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    console.error('[auth] password update failed', error)
    return { status: 'error', error: getSafeAuthError('Could not save your password. Please request a new link.') }
  }

  revalidatePath('/', 'layout')
  redirect(user ? await getDestination(supabase, user.id, explicitRedirectTo) : '/login')
}

export async function signInWithOAuthAction(
  provider: OAuthProvider,
  redirectTo?: string | null
) {
  const explicitRedirectTo = getExplicitRedirectParam(redirectTo)
  const callbackNext = explicitRedirectTo
    ? `?next=${encodeURIComponent(explicitRedirectTo)}`
    : ''

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getAppUrl()}/auth/callback${callbackNext}`,
    },
  })

  if (error) {
    console.error('[auth] OAuth start failed', error)
    redirect('/login?error=oauth_start_error')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      daily_goal_minutes: parsed.data.dailyGoalMinutes,
      preferred_mode: parsed.data.preferredMode,
    })
    .eq('id', user.id)

  if (error) return { error: 'Could not save settings.' }

  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return { success: true }
}
