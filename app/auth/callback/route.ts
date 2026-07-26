import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'
import {
  cleanupRejectedOAuthUser,
  handleOAuthCallbackUser,
  mapOAuthExchangeError,
  resolveOAuthCallbackPreExchange,
} from '@/lib/auth/oauth-callback'
import { getExplicitRedirectParam } from '@/lib/auth/resolve-redirect'
import { buildPublicAppUrl } from '@/lib/auth/app-url'
import { temporaryRedirect } from '@/lib/supabase/redirect-with-session'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const preExchangeFailure = resolveOAuthCallbackPreExchange(searchParams)

  if (preExchangeFailure) {
    return temporaryRedirect(buildPublicAppUrl(preExchangeFailure.redirectPath))
  }

  const code = searchParams.get('code')!
  const requestedNext = searchParams.get('next')
  const explicitNext = getExplicitRedirectParam(requestedNext)
  const resetRedirect = getExplicitRedirectParam(searchParams.get('redirectTo'))

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    const failure = mapOAuthExchangeError(error ?? { message: 'missing user' })
    return temporaryRedirect(buildPublicAppUrl(failure.redirectPath))
  }

  if (requestedNext === '/reset-password') {
    const resetPath = resetRedirect
      ? `/reset-password?redirectTo=${encodeURIComponent(resetRedirect)}`
      : '/reset-password'
    return temporaryRedirect(buildPublicAppUrl(resetPath))
  }

  const result = await handleOAuthCallbackUser(supabase, data.user, explicitNext)

  if (result.kind === 'failure') {
    if (result.shouldSignOut) {
      await supabase.auth.signOut()
    }

    if (result.shouldDeleteUser && result.userId) {
      await cleanupRejectedOAuthUser(result.userId)
    }

    return temporaryRedirect(buildPublicAppUrl(result.redirectPath))
  }

  return temporaryRedirect(buildPublicAppUrl(result.destination))
}
