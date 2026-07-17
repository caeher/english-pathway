import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'
import {
  buildReturnPath,
  getExplicitRedirectParam,
  resolvePostAuthDestination,
} from '@/lib/auth/resolve-redirect'
import { redirectWithSession, temporaryRedirect } from '@/lib/supabase/redirect-with-session'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isGuestOnlyRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')

  const isAccountRoute = pathname.startsWith('/settings')
  const isReviewRoute = pathname.startsWith('/review')
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const requiresAuth = isAccountRoute || isReviewRoute || isOnboardingRoute

  if (!user && requiresAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set(
      'redirectTo',
      buildReturnPath(pathname, request.nextUrl.search)
    )
    return temporaryRedirect(url)
  }

  if (user && isGuestOnlyRoute) {
    const explicitRedirectTo = getExplicitRedirectParam(
      request.nextUrl.searchParams.get('redirectTo')
    )
    let destination = resolvePostAuthDestination(explicitRedirectTo)

    const destinationPathname = destination.split('?')[0]
    if (destinationPathname === pathname) {
      destination = '/settings'
    }

    return redirectWithSession(destination, supabaseResponse)
  }

  return supabaseResponse
}
