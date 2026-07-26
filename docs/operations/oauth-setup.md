# OAuth setup (Google and GitHub)

English Pathway uses Supabase Auth for social login. The app starts OAuth from `/login` and `/register`, Supabase exchanges tokens with the provider, and the user returns to `/auth/callback`.

## Flow

```
User → App (signInWithOAuth) → Supabase → Google/GitHub
Google/GitHub → Supabase (/auth/v1/callback) → App (/auth/callback?code=...) → session
```

Three URL layers must stay aligned per environment:

| Layer | Who configures it | Example (local) |
| --- | --- | --- |
| App callback (`redirectTo`) | Supabase redirect allowlist | `http://localhost:3000/auth/callback?next=/learn` |
| Supabase callback | Google/GitHub OAuth app | `http://127.0.0.1:54321/auth/v1/callback` |
| App public URL | Google authorized JS origin; GitHub homepage | `http://localhost:3000` |

## Environment matrix

Replace placeholders with your team's real values. **Never commit Client Secrets or production credentials to the repository.**

| Setting | Local | Staging | Production |
| --- | --- | --- | --- |
| Supabase project ref | `english-pathway` (CLI) | `<staging-ref>` | `<prod-ref>` |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | `https://<staging-ref>.supabase.co` | `https://<prod-ref>.supabase.co` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://<staging-domain>` | `https://<prod-domain>` |
| Supabase Site URL | same as `NEXT_PUBLIC_APP_URL` | same | same |
| Supabase redirect allowlist | `http://localhost:3000/**` | `https://<staging-domain>/**` | `https://<prod-domain>/**` |
| Provider callback (Google + GitHub) | `http://127.0.0.1:54321/auth/v1/callback` | `https://<staging-ref>.supabase.co/auth/v1/callback` | `https://<prod-ref>.supabase.co/auth/v1/callback` |
| Google authorized JS origin | `http://localhost:3000` | `https://<staging-domain>` | `https://<prod-domain>` |
| `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` | `true` when ready | `true` when ready | `true` when ready |
| `NEXT_PUBLIC_OAUTH_GITHUB_ENABLED` | `true` when ready | `true` when ready | `true` when ready |

Use one Google OAuth client and one GitHub OAuth App **per environment**. Do not reuse production callbacks or secrets in local or staging.

Wildcard `/**` in Supabase covers `/auth/callback` and safe `?next=` destinations. The app validates `next` with `lib/auth/safe-redirect.ts`.

## Secret ownership

| Secret | Stored in | Owner |
| --- | --- | --- |
| Google Client ID / Secret | Supabase Auth provider settings (per project) | Platform / Supabase admin |
| GitHub Client ID / Secret | Supabase Auth provider settings (per project) | Platform / Supabase admin |
| Local provider secrets (`GOOGLE_*`, `GITHUB_*`) | Developer `.env.local` only | Individual developer |
| `NEXT_PUBLIC_*` app flags and URL | Deployment env (Coolify `.env`, Docker build args) | Release owner |
| Supabase anon / service role keys | Deployment env | Release owner |

Client Secrets belong in Supabase or a secrets manager — not in `.env.example`, logs, or issues.

---

## 1. Google Cloud Console (per environment)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services.
2. Configure the OAuth consent screen for the environment.
3. Create **Credentials → OAuth 2.0 Client ID → Web application**.
4. **Authorized JavaScript origins:** `NEXT_PUBLIC_APP_URL` for that environment.
5. **Authorized redirect URIs:** Supabase callback only (`https://<ref>.supabase.co/auth/v1/callback` or `http://127.0.0.1:54321/auth/v1/callback`).
6. Copy Client ID and Client Secret into the matching Supabase project (step 3 below).

## 2. GitHub OAuth App (per environment)

1. GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. **Application name:** e.g. `English Pathway (staging)`.
3. **Homepage URL:** `NEXT_PUBLIC_APP_URL`.
4. **Authorization callback URL:** Supabase callback for that environment.
5. Copy Client ID; generate a Client Secret and store both in Supabase.

## 3. Supabase Auth configuration

### Local (Supabase CLI)

1. Add provider credentials to `.env.local` (see `.env.example` comments). Variable names must **not** start with `SUPABASE_`.
2. Ensure `supabase/config.toml` has `[auth.external.google]` and `[auth.external.github]` with `env(...)` substitution.
3. Set `enabled = true` on each provider block once credentials exist.
4. Restart the stack: `pnpm db:stop && pnpm db:start`.
5. Set `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED=true` / `NEXT_PUBLIC_OAUTH_GITHUB_ENABLED=true` in `.env.local` only after providers work.

### Staging and production (Dashboard)

For each Supabase project:

1. **Authentication → Providers:** enable Google and GitHub; paste Client ID and Secret for **that** environment only.
2. **Authentication → URL Configuration:**
   - **Site URL:** `NEXT_PUBLIC_APP_URL`
   - **Redirect URLs:** `{NEXT_PUBLIC_APP_URL}/**`
3. Confirm no URLs from another environment appear in the allowlist.

## 4. Application environment variables

| Variable | When to set |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Always; must match the Supabase project for this deployment |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Always |
| `NEXT_PUBLIC_APP_URL` | Always; exact public URL including `https://` in deployed envs (required in production; no localhost fallback) |
| `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` | `true` only after Google is configured in Supabase for this env |
| `NEXT_PUBLIC_OAUTH_GITHUB_ENABLED` | `true` only after GitHub is configured in Supabase for this env |

OAuth flags are **build-time** in `Dockerfile`. After changing them, rebuild the image (`docker compose up --build` or Coolify redeploy).

Local quick start:

```bash
pnpm db:env          # writes Supabase keys + default flags (false)
# Add GOOGLE_* / GITHUB_* to .env.local, enable providers in config.toml
pnpm db:stop && pnpm db:start
# Set NEXT_PUBLIC_OAUTH_*_ENABLED=true when providers are verified
pnpm dev
```

---

## Secret rotation

1. Generate a new Client Secret in Google Cloud or GitHub for the affected environment.
2. Update **Supabase → Authentication → Providers** with the new secret.
3. Run the manual verification checklist below for that provider.
4. Revoke or delete the old secret in Google/GitHub after login succeeds.
5. Record the rotation date and owner in your team's ops log (not in git).

---

## Manual verification

Run for **each enabled provider × each environment** before enabling flags in production.

- [ ] OAuth button appears on `/login` and `/register` only when the matching `NEXT_PUBLIC_OAUTH_*_ENABLED=true`.
- [ ] Sign in with Google/GitHub from `/login` (no `redirectTo`) → lands on `/onboarding` (new user) or `/settings` (returning user).
- [ ] Sign in from `/login?redirectTo=/learn` → after onboarding, lands on `/learn`.
- [ ] Sign in from `/register` completes the same callback flow.
- [ ] Cancel OAuth at the provider returns to `/login?error=oauth_provider_denied` with a clear message.
- [ ] Visiting a protected route while logged out (`/chats`, `/settings`, `/curriculum`) and signing in with `?redirectTo=` returns to that route after onboarding.
- [ ] Reusing an existing account via OAuth succeeds or shows `oauth_identity_linked`.
- [ ] OAuth buttons ignore double-clicks while pending; email login still works independently.
- [ ] Google/GitHub OAuth app lists only the Supabase callback for this environment.
- [ ] Supabase redirect allowlist includes only this environment's app URL pattern.
- [ ] Logout and re-login still works.
- [ ] With flag `true` but missing Supabase credentials, user sees `oauth_start_error` on login (button should stay off until configured).

Attach screenshots or short notes to the release PR. Use [oauth-smoke-evidence.md](./oauth-smoke-evidence.md) as a copy-paste template.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `oauth_start_error` on login | Provider disabled in Supabase or invalid Client ID/Secret | Check Supabase Providers and local `config.toml` + env vars |
| `oauth_provider_denied` | User cancelled at Google/GitHub | Retry OAuth or use email sign-in |
| `oauth_provider_disabled` | Provider flag off or direct server action with disabled provider | Enable `NEXT_PUBLIC_OAUTH_*_ENABLED` only after provider is configured |
| `oauth_session_expired` | PKCE code expired or callback opened too late | Start sign-in again from `/login` |
| `auth_callback_error` | Code exchange failed or allowlist mismatch | Confirm `{APP_URL}/**` in Supabase; check browser network tab |
| `redirect_uri_mismatch` (Google/GitHub) | Provider callback URL wrong | Must be Supabase `/auth/v1/callback`, not `/auth/callback` |
| OAuth works but wrong post-login path | `next` not allowlisted | Use `{APP_URL}/**` wildcard in Supabase |
| Button visible but login always fails | Flag `true` before Supabase provider ready | Set flag `true` only after end-to-end test |
| Local Google fails with nonce error | Google local dev quirk | Keep `skip_nonce_check = true` in `config.toml` for local Google |
| Env vars ignored locally | Name starts with `SUPABASE_` | Use `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, etc. |

## Related code

- App URL helpers: `lib/auth/app-url.ts`
- Provider flags: `lib/auth/oauth-providers.ts`
- OAuth start: `lib/auth/actions.ts` → `signInWithOAuthAction`
- Callback: `app/auth/callback/route.ts`
- UI: `app/(auth)/_components/oauth-buttons.tsx`
