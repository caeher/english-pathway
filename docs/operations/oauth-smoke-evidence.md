# OAuth smoke evidence template

Copy this section into the PR that closes issue #151. Replace placeholders and check items after manual testing in each environment.

**Tester:** _______________  
**Date:** _______________

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

Notes: _______________

## Environment: Staging

**App URL:** `https://<staging-domain>`  
**Supabase ref:** `<staging-ref>`

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

Notes: _______________

## Environment: Production

**App URL:** `https://<prod-domain>`  
**Supabase ref:** `<prod-ref>`

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

Notes: _______________

## Server-side hardening checks

- [ ] Direct server action call with disabled provider redirects to `/login?error=oauth_provider_disabled`
- [ ] Production deployment does not build OAuth callbacks toward `http://localhost:3000`
- [ ] External `redirectTo` values are rejected; internal product routes (`/learn`, `/chats`, `/review`, `/curriculum`) are preserved

## Automated contract (CI)

- [ ] `pnpm test -- __tests__/auth` passes
- [ ] `pnpm test:critical` passes

See [oauth-setup.md](./oauth-setup.md) for setup and troubleshooting.
