import { execSync } from 'node:child_process'
import { getOAuthEnv } from './oauth-env.mjs'

const { projectRef, appUrl, supabaseUrl, providerCallback, expectedAllowlist } = getOAuthEnv()

function getApiKey(name) {
  if (supabaseUrl.includes('127.0.0.1')) {
    const output = execSync('pnpm exec supabase status -o json', { encoding: 'utf-8' })
    const status = JSON.parse(output)
    if (name === 'anon') return status.ANON_KEY
    if (name === 'service_role') return status.SERVICE_ROLE_KEY
    throw new Error(`Could not resolve ${name} API key from local Supabase status`)
  }

  const output = execSync(
    `pnpm exec supabase projects api-keys list --project-ref ${projectRef} -o json`,
    { encoding: 'utf-8' },
  )
  const keys = JSON.parse(output)
  const entry = keys.find((key) => key.name === name || key.id === name)
  if (!entry?.api_key) {
    throw new Error(`Could not resolve ${name} API key from Supabase CLI`)
  }
  return entry.api_key
}

async function getAuthSettings(anonKey) {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Auth settings request failed (${response.status}): ${body}`)
  }

  return response.json()
}

async function getManagementAuthConfig() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) return null

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) return null
  return response.json()
}

async function probeGoogleOAuth(anonKey) {
  const redirectTo = `${appUrl}/auth/callback?next=%2Fsettings`
  const url = new URL(`${supabaseUrl}/auth/v1/authorize`)
  url.searchParams.set('provider', 'google')
  url.searchParams.set('redirect_to', redirectTo)

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    redirect: 'manual',
  })

  const location = response.headers.get('location')
  return {
    status: response.status,
    ok: response.status === 302 && Boolean(location?.includes('accounts.google.com')),
    redirectToUsed: redirectTo,
    locationHost: location ? new URL(location).host : null,
  }
}

function summarize(settings, management, probe) {
  const external = settings.external ?? {}
  const enabledProviders = Object.entries(external)
    .filter(([key, value]) => value === true && !['anonymous_users', 'email', 'phone'].includes(key))
    .map(([key]) => key)

  return {
    environment: {
      projectRef,
      appUrl,
      supabaseUrl,
      providerCallback,
      expectedAllowlist,
      googleFlagExpected: process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED === 'true',
      githubFlagExpected: process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED === 'true',
    },
    enabledProviders,
    oauthProbe: probe,
    management: management
      ? {
          site_url: management.site_url ?? null,
          uri_allow_list: management.uri_allow_list ?? management.additional_redirect_urls ?? null,
          external_google_enabled: management.external_google_enabled ?? null,
          external_github_enabled: management.external_github_enabled ?? null,
          google_client_id_set: Boolean(management.external_google_client_id),
          github_client_id_set: Boolean(management.external_github_client_id),
        }
      : null,
  }
}

function check(summary) {
  const issues = []

  if (!summary.enabledProviders.includes('google')) {
    issues.push('Google is not enabled in Supabase Auth.')
  }

  if (!summary.oauthProbe?.ok) {
    issues.push('Google OAuth authorize probe did not redirect to accounts.google.com.')
  }

  const mgmt = summary.management
  if (mgmt) {
    if (mgmt.site_url !== summary.environment.appUrl) {
      issues.push(
        `Site URL is "${mgmt.site_url ?? 'unset'}"; expected "${summary.environment.appUrl}".`,
      )
    }

    const allowList = Array.isArray(mgmt.uri_allow_list)
      ? mgmt.uri_allow_list
      : typeof mgmt.uri_allow_list === 'string'
        ? mgmt.uri_allow_list.split(',').map((entry) => entry.trim()).filter(Boolean)
        : []

    if (
      !allowList.some(
        (entry) => entry.replace(/\/$/, '') === summary.environment.expectedAllowlist.replace(/\/$/, ''),
      )
    ) {
      issues.push(
        `Redirect allowlist missing "${summary.environment.expectedAllowlist}". Current: ${JSON.stringify(allowList)}`,
      )
    }

    if (!mgmt.external_google_enabled) {
      issues.push('Google provider flag is disabled in Supabase management config.')
    } else if (!mgmt.google_client_id_set) {
      issues.push('Google provider is enabled but Client ID is missing.')
    }
  } else {
    issues.push('SUPABASE_ACCESS_TOKEN not set — skipped management API checks.')
  }

  return issues
}

const anonKey = getApiKey('anon')
const settings = await getAuthSettings(anonKey)
const management = await getManagementAuthConfig()
const probe = await probeGoogleOAuth(anonKey)
const summary = summarize(settings, management, probe)
const issues = check(summary)

console.log(JSON.stringify({ summary, issues, ok: issues.length === 0 }, null, 2))
process.exit(issues.length === 0 ? 0 : 1)
