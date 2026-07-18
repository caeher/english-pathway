import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  '.env.example',
  'docs/quality-gates.md',
  'docs/release-checklist.md',
  'lib/security/headers.ts',
  'lib/security/rate-limit.ts',
  'lib/quality/critical-routes.ts',
]

const missingFiles = requiredFiles.filter((file) => !existsSync(file))
if (missingFiles.length > 0) {
  console.error(`Missing quality-gate files: ${missingFiles.join(', ')}`)
  process.exit(1)
}

const envExample = readFileSync('.env.example', 'utf8')
for (const variable of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_APP_URL']) {
  if (!new RegExp(`^${variable}=`, 'm').test(envExample)) {
    console.error(`Missing required environment template entry: ${variable}`)
    process.exit(1)
  }
}

console.log('Quality gate configuration is complete.')
