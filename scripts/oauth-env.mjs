/**
 * Shared OAuth inspection/configuration environment.
 * Never commit secrets — only public URLs and project refs belong here.
 */

function required(name, fallback) {
  const value = process.env[name]?.trim() || fallback?.trim()
  if (!value) {
    throw new Error(`Missing ${name}. Set it in the environment or pass a fallback.`)
  }
  return value
}

export function getOAuthEnv() {
  const projectRef = required(
    'SUPABASE_PROJECT_REF',
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1')
      ? 'english-pathway'
      : process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1],
  )

  const appUrl = required('NEXT_PUBLIC_APP_URL', process.env.OAUTH_APP_URL)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    (projectRef === 'english-pathway'
      ? 'http://127.0.0.1:54321'
      : `https://${projectRef}.supabase.co`)

  const extraAllowlist = (process.env.OAUTH_EXTRA_ALLOWLIST ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return {
    projectRef,
    appUrl: appUrl.replace(/\/$/, ''),
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    extraAllowlist,
    providerCallback: `${supabaseUrl.replace(/\/$/, '')}/auth/v1/callback`,
    expectedAllowlist: `${appUrl.replace(/\/$/, '')}/**`,
  }
}
