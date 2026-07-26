import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  assertOAuthProviderAllowed,
  getAppUrl,
  getEnabledOAuthProviders,
  isOAuthProvider,
  isOAuthProviderEnabled,
} from '@/lib/auth/oauth-providers'
import { restoreTestEnv, setTestEnv, snapshotTestEnv } from '../helpers/env'

const ENV_KEYS = [
  'NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED',
  'NEXT_PUBLIC_OAUTH_GITHUB_ENABLED',
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV',
] as const

let envBefore: Record<string, string | undefined>

describe('oauth providers', () => {
  beforeEach(() => {
    envBefore = snapshotTestEnv(ENV_KEYS)
    setTestEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    restoreTestEnv(envBefore, ENV_KEYS)
  })

  it('returns no providers when feature flags are absent or false', () => {
    delete process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED
    delete process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED

    expect(getEnabledOAuthProviders()).toEqual([])

    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = 'false'
    process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED = 'false'
    expect(getEnabledOAuthProviders()).toEqual([])
  })

  it('includes only Google when its flag is true', () => {
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = 'true'
    delete process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED

    expect(getEnabledOAuthProviders()).toEqual([{ id: 'google', label: 'Google' }])
  })

  it('includes only GitHub when its flag is true', () => {
    delete process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED
    process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED = 'true'

    expect(getEnabledOAuthProviders()).toEqual([{ id: 'github', label: 'GitHub' }])
  })

  it('returns Google then GitHub when both flags are true', () => {
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = 'true'
    process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED = 'true'

    expect(getEnabledOAuthProviders()).toEqual([
      { id: 'google', label: 'Google' },
      { id: 'github', label: 'GitHub' },
    ])
  })

  it('falls back to localhost for app URL when unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    expect(getAppUrl()).toBe('http://localhost:3000')
  })

  it('uses NEXT_PUBLIC_APP_URL when set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example'

    expect(getAppUrl()).toBe('https://app.example')
  })

  it('identifies allowed OAuth providers', () => {
    expect(isOAuthProvider('google')).toBe(true)
    expect(isOAuthProvider('github')).toBe(true)
    expect(isOAuthProvider('facebook')).toBe(false)
  })

  it('checks provider enablement from feature flags', () => {
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = 'true'
    delete process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED

    expect(isOAuthProviderEnabled('google')).toBe(true)
    expect(isOAuthProviderEnabled('github')).toBe(false)
  })

  it('asserts only enabled providers are allowed', () => {
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = 'true'

    expect(() => assertOAuthProviderAllowed('google')).not.toThrow()
    expect(() => assertOAuthProviderAllowed('github')).toThrow('oauth_provider_disabled')
    expect(() => assertOAuthProviderAllowed('facebook')).toThrow('oauth_provider_disabled')
  })
})
