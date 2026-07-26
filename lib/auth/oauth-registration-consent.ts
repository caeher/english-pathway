import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import type { OAuthProvider } from '@/lib/auth/oauth-providers'
import { getExplicitRedirectParam } from '@/lib/auth/resolve-redirect'

export const OAUTH_REGISTRATION_CONSENT_COOKIE = 'ep_oauth_reg_consent'
const CONSENT_TTL_MS = 10 * 60 * 1000

export interface OAuthRegistrationConsentPayload {
  provider: OAuthProvider
  redirectTo: string | null
  nonce: string
  exp: number
}

function getAuthCookieSecret(): string {
  const secret = process.env.AUTH_COOKIE_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_COOKIE_SECRET must be set and at least 32 characters')
  }
  return secret
}

function signPayload(encodedPayload: string): string {
  return createHmac('sha256', getAuthCookieSecret()).update(encodedPayload).digest('base64url')
}

function encodePayload(payload: OAuthRegistrationConsentPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(encodedPayload: string): OAuthRegistrationConsentPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as OAuthRegistrationConsentPayload

    if (
      (parsed.provider !== 'google' && parsed.provider !== 'github') ||
      typeof parsed.nonce !== 'string' ||
      typeof parsed.exp !== 'number' ||
      (parsed.redirectTo !== null && typeof parsed.redirectTo !== 'string')
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function issueOAuthRegistrationConsent(
  provider: OAuthProvider,
  redirectTo?: string | null,
): string {
  const payload: OAuthRegistrationConsentPayload = {
    provider,
    redirectTo: getExplicitRedirectParam(redirectTo),
    nonce: randomBytes(16).toString('hex'),
    exp: Date.now() + CONSENT_TTL_MS,
  }

  const encodedPayload = encodePayload(payload)
  return `${encodedPayload}.${signPayload(encodedPayload)}`
}

export function verifyOAuthRegistrationConsent(
  token: string | null | undefined,
  expectedProvider: OAuthProvider,
): OAuthRegistrationConsentPayload | null {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = signPayload(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  const payload = decodePayload(encodedPayload)
  if (!payload) return null
  if (payload.provider !== expectedProvider) return null
  if (payload.exp < Date.now()) return null

  return payload
}

export async function setOAuthRegistrationConsentCookie(
  provider: OAuthProvider,
  redirectTo?: string | null,
): Promise<void> {
  const token = issueOAuthRegistrationConsent(provider, redirectTo)
  const cookieStore = await cookies()

  cookieStore.set(OAUTH_REGISTRATION_CONSENT_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(CONSENT_TTL_MS / 1000),
  })
}

export async function readOAuthRegistrationConsentCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(OAUTH_REGISTRATION_CONSENT_COOKIE)?.value
}

export async function clearOAuthRegistrationConsentCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(OAUTH_REGISTRATION_CONSENT_COOKIE)
}
