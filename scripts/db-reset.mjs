import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const supabaseBin = resolve(process.cwd(), 'node_modules', '.bin', 'supabase')

// Skip Storage/Kong health checks during reset — avoids 502 race on Windows.
process.env.SUPABASE_DB_ONLY = 'true'

try {
  execSync(`"${supabaseBin}" db reset`, { stdio: 'inherit', env: process.env })
} catch (error) {
  process.exit(error.status ?? 1)
}
