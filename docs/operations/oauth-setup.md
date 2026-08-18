# Social Logins / OAuth Setup

> [!NOTE]
> **Authentication is managed with Clerk (`@clerk/nextjs`).**
> Social connections (Google, GitHub, Apple, etc.) are managed directly in the **Clerk Dashboard** (`User & Authentication -> Social Connections`).
> The previous `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` and `NEXT_PUBLIC_OAUTH_GITHUB_ENABLED` flags, along with custom Supabase OAuth endpoints, have been removed.

---

## 1. Managing Social Providers (OAuth) in Clerk

Social connections are configured directly within the Clerk Dashboard without requiring code changes or application rebuilds.

1. Go to the [Clerk Dashboard](https://dashboard.clerk.com/).
2. Navigate to **User & Authentication → Social Connections**.
3. Enable your desired providers (e.g., **Google**, **GitHub**).
4. For development/testing, Clerk provides shared development credentials.
5. For production, configure custom credentials with your OAuth Client ID and Client Secret following Clerk's documentation.

---

## 2. Environment Variables

The application relies on standard Clerk keys in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/learn
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

---

## 3. UI and Flow

- Clerk's `<SignIn />` and `<SignUp />` components automatically display buttons for enabled social connections.
- Sign in route: `/sign-in`
- Sign up route: `/sign-up`
- New users complete registration and are routed to `/onboarding` before proceeding to `/learn` or `/settings`.
