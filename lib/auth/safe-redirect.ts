const GUEST_AUTH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth']

export function getRedirectPathname(path: string): string {
  return path.split('?')[0] ?? path
}

export function isGuestAuthPath(path: string): boolean {
  const pathname = getRedirectPathname(path)
  return GUEST_AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false
  const trimmed = path.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return false
  if (isGuestAuthPath(trimmed)) return false
  return true
}

export function getSafeRedirectPath(path: string | null, fallback = '/settings'): string {
  if (!isSafeRedirectPath(path)) return fallback
  return path.trim()
}

export function getAuthenticatedHomePath(): string {
  return '/onboarding'
}
