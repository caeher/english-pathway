const NEW_USER_WINDOW_MS = 120_000

export function isRecentlyCreatedUser(
  createdAt: string | undefined,
  now = Date.now(),
): boolean {
  if (!createdAt) return false
  const createdAtMs = Date.parse(createdAt)
  if (Number.isNaN(createdAtMs)) return false
  return now - createdAtMs <= NEW_USER_WINDOW_MS
}

export function isNewAuthUser(input: {
  createdAt: string | undefined
  hasRegistrationConsents: boolean
  now?: number
}): boolean {
  return isRecentlyCreatedUser(input.createdAt, input.now) && !input.hasRegistrationConsents
}
