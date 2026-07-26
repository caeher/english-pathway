import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildAuthCallbackUrl,
  getAppUrl,
  InvalidAppUrlError,
  parseAppUrl,
} from '@/lib/auth/app-url'

const ENV_KEYS = ['NEXT_PUBLIC_APP_URL', 'NODE_ENV'] as const

let envBefore: Record<string, string | undefined>

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = snapshot[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
}

describe('app url', () => {
  beforeEach(() => {
    envBefore = snapshotEnv()
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    restoreEnv(envBefore)
  })

  it('falls back to localhost in non-production when unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    expect(getAppUrl()).toBe('http://localhost:3000')
  })

  it('uses NEXT_PUBLIC_APP_URL when set in non-production', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example'

    expect(getAppUrl()).toBe('https://app.example')
  })

  it('throws in production when NEXT_PUBLIC_APP_URL is missing', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_APP_URL

    expect(() => getAppUrl()).toThrow(InvalidAppUrlError)
  })

  it('throws in production for http URLs', () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_APP_URL = 'http://app.example'

    expect(() => getAppUrl()).toThrow(InvalidAppUrlError)
  })

  it('throws in production for localhost URLs', () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_APP_URL = 'https://localhost:3000'

    expect(() => getAppUrl()).toThrow(InvalidAppUrlError)
  })

  it('accepts a valid https production URL', () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example'

    expect(getAppUrl()).toBe('https://app.example')
  })

  it('builds callback URLs with sanitized next destinations', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example'

    expect(buildAuthCallbackUrl('/learn')).toBe(
      'https://app.example/auth/callback?next=%2Flearn',
    )
    expect(buildAuthCallbackUrl('https://evil.com')).toBe('https://app.example/auth/callback')
  })

  it('rejects invalid URLs in parseAppUrl', () => {
    expect(parseAppUrl('not-a-url')).toBeNull()
    expect(parseAppUrl('ftp://app.example')).toBeNull()
  })
})
