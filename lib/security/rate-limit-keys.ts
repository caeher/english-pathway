export async function hashRateLimitIdentifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function buildRateLimitKey(args: {
  route: string
  userId?: string | null
  clientIp: string
}): Promise<string> {
  if (args.userId) {
    return `user:${await hashRateLimitIdentifier(args.userId)}:${args.route}`
  }
  return `ip:${args.clientIp}:${args.route}`
}

export async function fingerprintRateLimitKey(key: string): Promise<string> {
  return hashRateLimitIdentifier(key)
}
