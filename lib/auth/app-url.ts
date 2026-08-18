import { getExplicitRedirectParam } from '@/lib/auth/resolve-redirect'

const LOCAL_FALLBACK = 'http://localhost:3000'
const UNSPECIFIED_HOSTS = new Set(['0.0.0.0', '[::]', '::'])

export class InvalidAppUrlError extends Error {
  constructor(message = 'invalid_app_url') {
    super(message)
    this.name = 'InvalidAppUrlError'
  }
}

export function parseAppUrl(
  value: string | undefined,
  options: { requireProduction?: boolean } = {},
): string | null {
  if (!value?.trim()) return null

  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    // 0.0.0.0/:: are bind addresses for servers, not browser-reachable hosts.
    // Accepting either here makes OAuth redirect users to the container itself.
    if (UNSPECIFIED_HOSTS.has(url.hostname)) return null

    if (options.requireProduction) {
      if (url.protocol !== 'https:') return null
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return null
    }

    return url.origin
  } catch {
    return null
  }
}

export function getAppUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL
  const isProduction =
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build'

  if (isProduction) {
    const parsed = parseAppUrl(env, { requireProduction: true })
    if (!parsed) {
      console.error('[auth] missing or invalid NEXT_PUBLIC_APP_URL in production')
      throw new InvalidAppUrlError()
    }
    return parsed
  }

  return parseAppUrl(env) ?? LOCAL_FALLBACK
}

export function buildAuthCallbackUrl(next?: string | null): string {
  const explicitNext = getExplicitRedirectParam(next)
  const suffix = explicitNext ? `?next=${encodeURIComponent(explicitNext)}` : ''
  return `${getAppUrl()}/auth/callback${suffix}`
}

/**
 * Builds redirects from the configured public application URL instead of the
 * incoming request host. Reverse proxies commonly expose an internal host
 * such as 0.0.0.0:3000 to Next.js, which must never reach the browser.
 */
export function buildPublicAppUrl(path: string): string {
  return new URL(path, getAppUrl()).toString()
}
