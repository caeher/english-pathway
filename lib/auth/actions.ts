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
  error?: string
  success?: string
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
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const { email, password } = parsed.data
  const explicitRedirectTo = getExplicitRedirectParam(
    formData.get('redirectTo') as string | null
  )

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid credentials. Check your email and password.' }
  }

  revalidatePath('/', 'layout')
  redirect(resolvePostAuthDestination(explicitRedirectTo))
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
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
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
    return { error: error.message }
  }

  if (data.user && data.session) {
    await recordUserConsents(data.user.id)

    revalidatePath('/', 'layout')
    redirect(resolvePostAuthDestination(explicitRedirectTo))
  }

  return {
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
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'We sent you a link to reset your password.' }
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
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(resolvePostAuthDestination(null))
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
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
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
    })
    .eq('id', user.id)

  if (error) return { error: 'Could not save settings.' }

  revalidatePath('/settings')
  return { success: true }
}
