import { getAuthenticatedHomePath, isSafeRedirectPath } from '@/lib/auth/safe-redirect'

export function resolvePostAuthDestination(
  redirectTo: string | null | undefined,
  onboardingCompleted = false,
): string {
  const explicit = redirectTo?.trim()
  if (!onboardingCompleted) return '/onboarding'
  if (onboardingCompleted && explicit && isSafeRedirectPath(explicit)) {
    return explicit
  }
  return getAuthenticatedHomePath()
}

export function buildReturnPath(pathname: string, search: string): string {
  return search ? `${pathname}${search}` : pathname
}

export function appendRedirectTo(path: string, redirectTo: string | null | undefined): string {
  if (!redirectTo || !isSafeRedirectPath(redirectTo)) return path
  return `${path}?redirectTo=${encodeURIComponent(redirectTo)}`
}

export function getExplicitRedirectParam(
  value: string | null | undefined
): string | null {
  const explicit = value?.trim()
  if (!explicit || !isSafeRedirectPath(explicit)) return null
  return explicit
}
