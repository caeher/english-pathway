/**
 * Patch only Supabase Auth URL settings for a target environment.
 *
 * Requires SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens).
 * This avoids `supabase config push`, which can unintentionally sync unrelated
 * local auth/email/MFA defaults to cloud.
 */
import { getOAuthEnv } from './oauth-env.mjs'

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN before running this script.')
  process.exit(1)
}

const { projectRef, appUrl, extraAllowlist } = getOAuthEnv()

const allowlist = [
  `${appUrl}/**`,
  ...extraAllowlist,
  'http://localhost:3000/**',
  'http://127.0.0.1:3000/**',
]
  .map((entry) => entry.replace(/\/$/, ''))
  .filter((entry, index, all) => all.indexOf(entry) === index)

const body = {
  site_url: appUrl,
  uri_allow_list: allowlist.join(','),
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

const text = await response.text()
if (!response.ok) {
  console.error(`Failed to patch auth config (${response.status}): ${text}`)
  process.exit(1)
}

console.log('Updated Supabase auth URL configuration:')
console.log(JSON.stringify({ projectRef, ...body }, null, 2))
