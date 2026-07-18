import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isSameOriginRequest, isUnsafeMethod } from '@/lib/security/request'
import { consumeRateLimit, getClientKey, getRateLimitPolicy } from '@/lib/security/rate-limit'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (isUnsafeMethod(request.method) && !isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 })
    }

    const policy = getRateLimitPolicy(request.nextUrl.pathname)
    if (policy) {
      const result = consumeRateLimit(
        `${getClientKey(request)}:${request.nextUrl.pathname}`,
        policy,
      )
      if (!result.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } },
        )
      }
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
