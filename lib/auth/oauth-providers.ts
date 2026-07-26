import { getAppUrl } from '@/lib/auth/app-url'

export type OAuthProvider = 'google' | 'github'

export interface OAuthProviderConfig {
  id: OAuthProvider
  label: string
}

const ALLOWED_OAUTH_PROVIDERS = new Set<OAuthProvider>(['google', 'github'])

const PROVIDER_DEFINITIONS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: { id: 'google', label: 'Google' },
  github: { id: 'github', label: 'GitHub' },
}

// This module is also imported by OAuthButtons, a client component. Next.js
// only replaces NEXT_PUBLIC_* variables when their property access is static;
// process.env[envKey] therefore becomes undefined in the browser bundle.
function isGoogleOAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED === 'true'
}

function isGithubOAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED === 'true'
}

export function isOAuthProvider(provider: string): provider is OAuthProvider {
  return ALLOWED_OAUTH_PROVIDERS.has(provider as OAuthProvider)
}

export function isOAuthProviderEnabled(provider: OAuthProvider): boolean {
  switch (provider) {
    case 'google':
      return isGoogleOAuthEnabled()
    case 'github':
      return isGithubOAuthEnabled()
    default:
      return false
  }
}

export function assertOAuthProviderAllowed(provider: string): asserts provider is OAuthProvider {
  if (!isOAuthProvider(provider)) {
    throw new Error('oauth_provider_disabled')
  }

  if (!isOAuthProviderEnabled(provider)) {
    throw new Error('oauth_provider_disabled')
  }
}

export function getEnabledOAuthProviders(): OAuthProviderConfig[] {
  const providers: OAuthProviderConfig[] = []

  if (isOAuthProviderEnabled('google')) {
    providers.push(PROVIDER_DEFINITIONS.google)
  }

  if (isOAuthProviderEnabled('github')) {
    providers.push(PROVIDER_DEFINITIONS.github)
  }

  return providers
}

export { getAppUrl, buildAuthCallbackUrl } from '@/lib/auth/app-url'
