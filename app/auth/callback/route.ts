import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'
import { recordUserConsents } from '@/lib/auth/consent'
import {
  getExplicitRedirectParam,
  resolvePostAuthDestination,
} from '@/lib/auth/resolve-redirect'
import { temporaryRedirect } from '@/lib/supabase/redirect-with-session'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const explicitNext = getExplicitRedirectParam(searchParams.get('next'))

  if (code) {
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

    if (!error && data.user) {
      if (data.user.user_metadata?.accepted_terms === true) {
        await recordUserConsents(data.user.id)
      }

      const destination = resolvePostAuthDestination(explicitNext)
      return temporaryRedirect(`${origin}${destination}`)
    }
  }

  return temporaryRedirect(`${origin}/login?error=auth_callback_error`)
}
