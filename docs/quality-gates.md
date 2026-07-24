# Quality gates

This document is the release contract for English Pathway. Every pull request must pass `pnpm lint`, `pnpm test:critical`, the complete `pnpm test`, `pnpm quality:check`, `pnpm security:audit`, TypeScript checking, and `pnpm build`. The workflow in `.github/workflows/deploy.yml` is the required branch protection check. High and critical production dependency advisories block the release; moderate advisories require triage and a tracked remediation decision.

## Critical journeys

| Journey | Automated contract | Provider smoke test | Manual evidence |
| --- | --- | --- | --- |
| Visitor → registration/confirmation → onboarding → Learn | auth redirects, onboarding schemas, assessment rubric | Supabase email confirmation | desktop + 390px viewport recording or screenshots |
| Login/logout and password reset | auth redirect tests | Supabase Auth + Mailpit/cloud email | successful login, logout, reset link |
| Curriculum → activity → progress → resume | curriculum href/progress/activity tests | Supabase progress persistence | reload after completion and resume |
| Learn without ElevenLabs or RAG | tutor state, fallback, memory, and schema tests | none required | text mode works with provider variables absent |
| Voice with and without microphone | microphone and tutor lifecycle tests | ElevenLabs agent | permission denied, stop session, no active track |
| Legal pages and consent | legal version, analytics schema, cookie-gate tests | Supabase consent write | consent choice, export/delete, legal metadata |

## Activity change checks

| Change | Required automated checks | Manual/browser evidence |
| --- | --- | --- |
| Any activity contract, renderer, or curriculum activity | `pnpm activities:validate`, `pnpm test -- __tests__/activities __tests__/learn`, full `pnpm test` | Complete, restart, retry, skip, and exit one representative activity at desktop and 390px widths. |
| Feedback, scoring, SRS, or persistence | The activity checks above plus `pnpm test -- __tests__/games __tests__/srs __tests__/progress` | Confirm an incorrect result explains the correction and the follow-up review retains prompt, answer, and chapter context. |
| Interaction, keyboard, or visual-state changes | The activity checks above plus accessibility and reduced-motion tests | Keyboard-only pass (Tab, Enter, Space) for the changed state; verify focus, live feedback, loading, error/retry, and dark mode. |

The activity behavior matrix is enforced in `__tests__/activities/behavior-matrix.test.ts`. It requires every registered type to share reset, retry, result, persistence, and review behavior, and it uses one valid curriculum item per type as a schema fixture. Browser checks deliberately target completion and recovery states because they combine interaction, navigation, and responsive layout risks that unit tests cannot render.

The provider smoke journeys run in a staging environment with test accounts. They are not run in public CI because they require secrets and can create external data. A failed provider smoke test blocks release even if unit/contract checks pass.

## Accessibility review

Before release, test keyboard-only navigation, visible focus, form labels/errors, mobile menu focus return, dialogs, tables, Markdown headings/links, microphone controls, and both light/dark themes. Automated checks belong in component tests; manual evidence covers browser behavior and contrast at the deployed URL. No critical accessibility defect may be released.

## Performance and observability

`performance-budgets.json` defines the CSS, font, image, JavaScript, and Web Vitals budgets for public and authenticated critical routes. `pnpm performance:check` runs after the production build in CI and blocks regressions in global CSS, raster image weight, and `next/font` swap configuration. Capture field Web Vitals in release evidence and compare them with the documented route budgets.

Budgets are encoded in `lib/quality/critical-routes.ts`:

- public routes: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.10, client JS ≤ 220 kB;
- authenticated routes: LCP ≤ 3.0 s, INP ≤ 200 ms, CLS ≤ 0.10, client JS ≤ 320 kB;
- RAG request: p95 ≤ 2.5 s.

Record Web Vitals, API status/latency, provider fallback, and session lifecycle counts only. Never send email, user IDs, transcripts, prompt content, memory content, access tokens, or raw provider errors to analytics.

## API resilience contract

Every API error uses `{ error, code }`. State-changing progress, engagement, SRS, and tutor-memory routes are rate-limited per client and route; `429 RATE_LIMITED` includes `Retry-After`. Route operations have a 10-second server response budget and return `504 TIMEOUT` when it expires.

Progress writes are idempotent by `(user_id, activity_id)`: duplicate activity requests preserve the highest score, attempt count, and completed state. Engagement awards are idempotent by `(user_id, activity_id)`, so retries cannot award XP or increment daily activity counts twice.

## Security contract

`next.config.ts` applies the security headers tested by the quality suite. Unsafe API requests are same-origin checked in middleware. Expensive tutor/assessment routes have a per-process fallback rate limit; the deployment edge must also enforce a distributed limit because serverless instances do not share memory. APIs validate request bodies with Zod and return generic client errors without provider secrets.

Prompt-injection trust boundaries, delimiter rules, and adversarial regression tests are documented in [`docs/security/prompt-trust.md`](security/prompt-trust.md) and enforced by `__tests__/security/`.
