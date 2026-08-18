# OAuth smoke evidence (Archived / Historical Reference)

> [!NOTE]
> Authentication has been migrated to Clerk (`@clerk/nextjs`). This evidence log records the previous Supabase OAuth verification tests and is kept for historical context.

**Tester:** Engineering  
**Date:** 2026-07-26

## Automated inspection (production)

Command:

```bash
SUPABASE_PROJECT_REF=ivwtieqsyekrhvxpvtqe \
NEXT_PUBLIC_APP_URL=https://english-pathway.cubepath.caeher.com \
NEXT_PUBLIC_SUPABASE_URL=https://ivwtieqsyekrhvxpvtqe.supabase.co \
pnpm oauth:inspect
```

| Check | Result |
| --- | --- |
| Google enabled in Supabase Auth | Run `pnpm oauth:inspect` and attach sanitized JSON |
| Site URL matches `NEXT_PUBLIC_APP_URL` | Run `pnpm oauth:inspect` |
| Redirect allowlist includes `{APP_URL}/**` | Run `pnpm oauth:inspect` |
| Google authorize probe redirects to `accounts.google.com` | Run `pnpm oauth:inspect` |
| GitHub disabled in Supabase | Expected: not in `enabledProviders` |

Notes: Management API checks require `SUPABASE_ACCESS_TOKEN`. Never paste tokens or Client Secrets in PRs.

## Environment: Local

| Check | Google | GitHub |
| --- | --- | --- |
| Button visible only with flag `true` | [ ] | [ ] |
| Login from `/login` → `/auth/callback` → destination | [ ] | [ ] |
| Register from `/register` with terms accepted → onboarding or destination | [ ] | [ ] |
| Login with `?redirectTo=/learn` after onboarding | [ ] | [ ] |
| Protected route return (`/chats`, `/settings`, `/curriculum`) via `?redirectTo=` | [ ] | [ ] |
| Cancel at provider → `/login?error=oauth_provider_denied` with clear message | [ ] | [ ] |
| Existing account reuse (OAuth email already registered) → login or `oauth_identity_linked` | [ ] | [ ] |
| Double-click ignored while OAuth button is pending | [ ] | [ ] |
| Provider callback is `http://127.0.0.1:54321/auth/v1/callback` | [ ] | [ ] |

Notes: Local Google requires credentials in `.env.local`, `enabled = true` in `supabase/config.toml`, and `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED=true`.

## Environment: Staging

**App URL:** _not deployed yet_  
**Supabase ref:** _not deployed yet_

| Check | Google | GitHub |
| --- | --- | --- |
| Button visible only with flag `true` | [ ] | [ ] |
| Login from `/login` → `/auth/callback` → destination | [ ] | [ ] |
| Register from `/register` with terms accepted → onboarding or destination | [ ] | [ ] |
| Login with `?redirectTo=/learn` after onboarding | [ ] | [ ] |
| Protected route return (`/chats`, `/settings`, `/curriculum`) via `?redirectTo=` | [ ] | [ ] |
| Cancel at provider → `/login?error=oauth_provider_denied` with clear message | [ ] | [ ] |
| Existing account reuse (OAuth email already registered) → login or `oauth_identity_linked` | [ ] | [ ] |
| Double-click ignored while OAuth button is pending | [ ] | [ ] |
| Provider callback matches staging Supabase URL | [ ] | [ ] |
| `NEXT_PUBLIC_APP_URL` is HTTPS and matches deployed domain | [ ] | [ ] |

Notes: Staging is not configured in this repository yet.

## Environment: Production

**App URL:** `https://english-pathway.cubepath.caeher.com`  
**Supabase ref:** `ivwtieqsyekrhvxpvtqe`

| Check | Google | GitHub |
| --- | --- | --- |
| Button visible only with flag `true` | [ ] | [ ] |
| Login from `/login` → `/auth/callback` → destination | [ ] | [ ] |
| Register from `/register` with terms accepted → onboarding or destination | [ ] | [ ] |
| Login with `?redirectTo=/learn` after onboarding | [ ] | [ ] |
| Protected route return (`/chats`, `/settings`, `/curriculum`) via `?redirectTo=` | [ ] | [ ] |
| Cancel at provider → `/login?error=oauth_provider_denied` with clear message | [ ] | [ ] |
| Existing account reuse (OAuth email already registered) → login or `oauth_identity_linked` | [ ] | [ ] |
| Double-click ignored while OAuth button is pending | [ ] | [ ] |
| Provider callback matches production Supabase URL | [ ] | [ ] |
| `NEXT_PUBLIC_APP_URL` is HTTPS and matches deployed domain | [ ] | [ ] |

Notes: Set `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED=true` in Coolify/Docker build args and redeploy after manual checks pass. Keep `NEXT_PUBLIC_OAUTH_GITHUB_ENABLED=false` until GitHub OAuth App exists.

## Server-side hardening checks

- [ ] Direct server action call with disabled provider redirects to `/login?error=oauth_provider_disabled`
- [ ] Production deployment does not build OAuth callbacks toward `http://localhost:3000`
- [ ] External `redirectTo` values are rejected; internal product routes (`/learn`, `/chats`, `/review`, `/curriculum`) are preserved through onboarding via `?next=`

## Automated contract (CI)

- [ ] `pnpm test -- __tests__/auth` passes
- [ ] `pnpm test:critical` passes

See [oauth-setup.md](./oauth-setup.md) for setup and troubleshooting.
