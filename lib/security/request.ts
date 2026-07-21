const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function isUnsafeMethod(method: string): boolean {
  return unsafeMethods.has(method.toUpperCase())
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() ?? null
}

export function resolveRequestOrigin(request: Request & { url: string }): string {
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'))
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'))

  if (forwardedHost) {
    return `${forwardedProto ?? 'https'}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

function trustedAppOrigin(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return null

  try {
    return new URL(appUrl).origin
  } catch {
    return null
  }
}

export function isSameOriginRequest(request: Request & { url: string }): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  if (origin === resolveRequestOrigin(request)) return true

  const trustedOrigin = trustedAppOrigin()
  return trustedOrigin !== null && origin === trustedOrigin
}
