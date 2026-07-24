import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'
import { updateSession } from '@/lib/supabase/middleware'
import { isSameOriginRequest, isUnsafeMethod } from '@/lib/security/request'
import { getClientKey, getRateLimitPolicy } from '@/lib/security/rate-limit'
import { buildRateLimitKey } from '@/lib/security/rate-limit-keys'
import { getRateLimitStore } from '@/lib/security/rate-limit-store'
import { rateLimitResponse } from '@/lib/security/enforce-rate-limit'

async function getApiUserId(request: NextRequest): Promise<string | null> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/admin') || pathname.startsWith('/teacher')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/')) {
    if (isUnsafeMethod(request.method) && !isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 })
    }

    const policy = getRateLimitPolicy(pathname)
    if (policy) {
      const userId = await getApiUserId(request)
      const key = await buildRateLimitKey({
        route: pathname,
        userId,
        clientIp: getClientKey(request),
      })
      const result = await getRateLimitStore().consume(key, policy)
      if (!result.allowed) {
        return rateLimitResponse(result.retryAfterSeconds)
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
