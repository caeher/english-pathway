import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { recordUserConsents } from '@/lib/auth/consent'
import { isNewAuthUser } from '@/lib/auth/is-new-auth-user'
import {
  getOAuthErrorRedirectPath,
  mapSupabaseAuthError,
  type OAuthErrorCode,
} from '@/lib/auth/oauth-errors'
import {
  clearOAuthRegistrationConsentCookie,
  readOAuthRegistrationConsentCookie,
  verifyOAuthRegistrationConsent,
  type OAuthProvider,
} from '@/lib/auth/oauth-registration-consent'
import { resolvePostAuthDestination } from '@/lib/auth/resolve-redirect'
import { createAdminClient } from '@/lib/supabase/admin'

type AppSupabaseClient = SupabaseClient<Database>

export type OAuthCallbackSuccess = {
  kind: 'success'
  destination: string
}

export type OAuthCallbackFailure = {
  kind: 'failure'
  redirectPath: string
  shouldSignOut: boolean
  shouldDeleteUser: boolean
  userId?: string
}

export type OAuthCallbackResult = OAuthCallbackSuccess | OAuthCallbackFailure

function getOAuthProviderFromUser(user: User): OAuthProvider | null {
  const provider = user.app_metadata?.provider
  if (provider === 'google' || provider === 'github') return provider

  const identityProvider = user.identities?.[0]?.provider
  if (identityProvider === 'google' || identityProvider === 'github') {
    return identityProvider
  }

  return null
}

function hasVerifiableEmail(user: User): boolean {
  return Boolean(user.email?.trim())
}

async function userHasRegistrationConsents(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from('user_consents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('[auth] failed to read user consents', error)
    return false
  }

  return (count ?? 0) > 0
}

function failure(
  code: OAuthErrorCode,
  options: Omit<OAuthCallbackFailure, 'kind' | 'redirectPath'> = {
    shouldSignOut: false,
    shouldDeleteUser: false,
  },
): OAuthCallbackFailure {
  return {
    kind: 'failure',
    redirectPath: getOAuthErrorRedirectPath(code),
    ...options,
  }
}

export async function handleOAuthCallbackUser(
  supabase: AppSupabaseClient,
  user: User,
  explicitNext: string | null,
): Promise<OAuthCallbackResult> {
  if (!hasVerifiableEmail(user)) {
    return failure('oauth_no_email', {
      shouldSignOut: true,
      shouldDeleteUser: true,
      userId: user.id,
    })
  }

  const provider = getOAuthProviderFromUser(user)
  const consentToken = await readOAuthRegistrationConsentCookie()
  const verifiedConsent = provider
    ? verifyOAuthRegistrationConsent(consentToken, provider)
    : null

  const hasRegistrationConsents = await userHasRegistrationConsents(supabase, user.id)
  const isNewUser = isNewAuthUser({
    createdAt: user.created_at,
    hasRegistrationConsents,
  })

  if (isNewUser) {
    if (!verifiedConsent) {
      return failure('oauth_terms_required', {
        shouldSignOut: true,
        shouldDeleteUser: true,
        userId: user.id,
      })
    }

    await recordUserConsents(user.id)
    await clearOAuthRegistrationConsentCookie()
  } else if (consentToken) {
    await clearOAuthRegistrationConsentCookie()
  } else if (user.user_metadata?.accepted_terms === true && !hasRegistrationConsents) {
    await recordUserConsents(user.id)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  return {
    kind: 'success',
    destination: resolvePostAuthDestination(
      explicitNext,
      Boolean(profile?.onboarding_completed_at),
    ),
  }
}

export function mapOAuthExchangeError(error: { message?: string; code?: string }): OAuthCallbackFailure {
  return failure(mapSupabaseAuthError(error))
}

export type OAuthCallbackPreExchangeFailure = {
  kind: 'pre_exchange_failure'
  redirectPath: string
}

export function resolveOAuthCallbackPreExchange(
  searchParams: URLSearchParams,
): OAuthCallbackPreExchangeFailure | null {
  if (searchParams.get('error')) {
    return {
      kind: 'pre_exchange_failure',
      redirectPath: getOAuthErrorRedirectPath('oauth_provider_denied'),
    }
  }

  if (!searchParams.get('code')) {
    return {
      kind: 'pre_exchange_failure',
      redirectPath: getOAuthErrorRedirectPath('auth_callback_error'),
    }
  }

  return null
}

export async function cleanupRejectedOAuthUser(userId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) {
      console.error('[auth] failed to delete rejected OAuth user', error)
    }
  } catch (error) {
    console.warn('[auth] skipped OAuth user cleanup; admin client unavailable', error)
  }
}
