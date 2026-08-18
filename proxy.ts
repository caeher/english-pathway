import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { isSameOriginRequest, isUnsafeMethod } from '@/lib/security/request'
import { getClientKey, getRateLimitPolicy } from '@/lib/security/rate-limit'
import { buildRateLimitKey } from '@/lib/security/rate-limit-keys'
import { getRateLimitStore } from '@/lib/security/rate-limit-store'
import { rateLimitResponse } from '@/lib/security/enforce-rate-limit'
import { isMaintenanceModeActive } from '@/lib/maintenance/config'

const isPublicRoute = createRouteMatcher([
  '/',
  '/how-it-works(.*)',
  '/faq(.*)',
  '/legal(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/api/webhooks(.*)',
  '/maintenance(.*)',
])

const isProtectedRoute = createRouteMatcher([
  '/settings(.*)',
  '/dashboard(.*)',
  '/chats(.*)',
  '/curriculum(.*)',
  '/review(.*)',
  '/onboarding(.*)',
  '/learn(.*)',
])

const clerkHandler = clerkMiddleware(async (auth, request: NextRequest) => {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/')) {
    if (isUnsafeMethod(request.method) && !isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 })
    }

    const policy = getRateLimitPolicy(pathname)
    if (policy) {
      const { userId } = await auth()
      const key = await buildRateLimitKey({
        route: pathname,
        userId: userId ?? null,
        clientIp: getClientKey(request),
      })
      const result = await getRateLimitStore().consume(key, policy)
      if (!result.allowed) {
        return rateLimitResponse(result.retryAfterSeconds)
      }
    }
  }

  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export async function proxy(request: NextRequest, event?: any) {
  const pathname = request.nextUrl.pathname

  if (isMaintenanceModeActive()) {
    if (!pathname.startsWith('/maintenance')) {
      const url = request.nextUrl.clone()
      url.pathname = '/maintenance'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  } else if (pathname.startsWith('/maintenance')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/teacher')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  if (pathname === '/register') {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-up'
    return NextResponse.redirect(url)
  }

  return (await clerkHandler(request, event)) ?? NextResponse.next()
}

export default proxy

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
