import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const entries = {
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ci-placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'ci-placeholder-anon-key',
  NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED:
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED ?? 'false',
  NEXT_PUBLIC_OAUTH_GITHUB_ENABLED:
    process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED ?? 'false',
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://ci.english-pathway.example',
}

const lines = [
  '# Generated for CI build — do not commit',
  ...Object.entries(entries).map(([key, value]) => `${key}=${value}`),
  '',
]

const envPath = resolve(process.cwd(), '.env.local')
writeFileSync(envPath, lines.join('\n'), 'utf-8')
console.log(`Wrote ${envPath}`)
