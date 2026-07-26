import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'
import { getMissingLegalConsentsForClient } from '@/lib/auth/required-consent'
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

  const isLearnRoute = pathname.startsWith('/learn')
  const isAccountRoute = pathname.startsWith('/settings') || pathname.startsWith('/dashboard') || pathname.startsWith('/chats')
  const isCurriculumRoute = pathname.startsWith('/curriculum')
  const isReviewRoute = pathname.startsWith('/review')
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isLegalRoute = pathname.startsWith('/legal')
  const requiresAuth = isAccountRoute || isCurriculumRoute || isReviewRoute || isOnboardingRoute || isLearnRoute

  if (user && requiresAuth && !isLegalRoute && !pathname.startsWith('/settings')) {
    const missingConsents = await getMissingLegalConsentsForClient(supabase, user.id)
    if (missingConsents.length > 0) {
      const url = request.nextUrl.clone()
      url.pathname = '/settings'
      url.search = ''
      url.searchParams.set('reconsent', '1')
      return temporaryRedirect(url)
    }
  }

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle()
    let destination = resolvePostAuthDestination(
      explicitRedirectTo,
      Boolean(profile?.onboarding_completed_at),
    )

    const destinationPathname = destination.split('?')[0]
    if (destinationPathname === pathname) {
      destination = '/settings'
    }

    return redirectWithSession(new URL(destination, request.nextUrl), supabaseResponse)
  }

  return supabaseResponse
}
