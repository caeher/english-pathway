import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'
import {
  getExplicitRedirectParam,
  resolvePostAuthDestination,
} from '@/lib/auth/resolve-redirect'
import { temporaryRedirect } from '@/lib/supabase/redirect-with-session'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const explicitNext = getExplicitRedirectParam(searchParams.get('next'))

  if (token_hash && type) {
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

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email_change',
    })

    if (!error) {
      const destination = resolvePostAuthDestination(explicitNext)
      return temporaryRedirect(`${origin}${destination}`)
    }
  }

  return temporaryRedirect(`${origin}/login?error=confirmation_error`)
}
