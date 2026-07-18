const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function isUnsafeMethod(method: string): boolean {
  return unsafeMethods.has(method.toUpperCase())
}

export function isSameOriginRequest(request: Request & { url: string }): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  return origin === new URL(request.url).origin
}
