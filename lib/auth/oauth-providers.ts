export type OAuthProvider = 'google' | 'github'

export interface OAuthProviderConfig {
  id: OAuthProvider
  label: string
}

const PROVIDER_DEFINITIONS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: { id: 'google', label: 'Google' },
  github: { id: 'github', label: 'GitHub' },
}

function isEnabled(envKey: string): boolean {
  return process.env[envKey] === 'true'
}

export function getEnabledOAuthProviders(): OAuthProviderConfig[] {
  const providers: OAuthProviderConfig[] = []

  if (isEnabled('NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED')) {
    providers.push(PROVIDER_DEFINITIONS.google)
  }

  if (isEnabled('NEXT_PUBLIC_OAUTH_GITHUB_ENABLED')) {
    providers.push(PROVIDER_DEFINITIONS.github)
  }

  return providers
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}
