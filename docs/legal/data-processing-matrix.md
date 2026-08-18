# Data processing matrix

Technical audit backing issue **#161**. Each row is verified against the current codebase unless marked **operator confirmation required**. This document contains no secrets.

| Data category | Examples | Source | Purpose | Provider / storage | Retention | User control |
| --- | --- | --- | --- | --- | --- | --- |
| Account | Email, name, auth user id, OAuth provider identifiers | Registration, OAuth, profile settings | Authentication and account management | Supabase Auth + `profiles` | While account exists | Update profile in Settings; password reset via email |
| Native language | ISO language code | Onboarding, Settings | Personalize learning experience | `profiles.native_language` | While account exists | Update in Settings or onboarding review |
| Learning progress | Level, daily goal, preferred mode, chapter/activity results, SRS items | `/learn`, activities, review flows | Personalize lessons and show progress | Supabase user-scoped tables + local session store | While account exists | Progress tied to account; tutor memory export/delete separate |
| Tutor memory | Bounded session summaries (≤4000 chars), learner notes (≤2000 chars) | Voice/text tutor sessions | Resume context across sessions | `tutor_session_summaries`, `learner_memory` | Summaries expire after 365 days; notes until deleted | Export/delete in Settings (`/api/tutor/memory`) |
| Tutor voice stream | Live microphone audio | User-initiated voice mode | Real-time conversation | ElevenLabs or OpenAI Realtime (in transit only) | Not stored as raw audio in app database | Use text mode; deny mic permission |
| English Assistant | Conversation titles, user/assistant message text, prompt logs | `/chats` authenticated feature | Grammar and English Q&A with history | `english_assistant_conversations`, `english_assistant_messages`, `english_assistant_prompt_logs` + OpenAI Responses API | While account exists | Delete conversations in UI; account deletion via privacy contact |
| Shared curriculum RAG | Canonical chapter text chunks | `knowledge/` ingest | Retrieve teaching context | `knowledge_embeddings` (OpenAI embeddings + Supabase pgvector) | Shared content, not per-user copies | N/A (not learner-private) |
| Essential cookies | Supabase session cookies | Sign-in | Authentication and security | Browser cookies via Supabase | Session / provider defaults | Sign out; clear site data |
| Preferences | Theme, cookie consent choice | UI interactions | Accessibility and consent state | `localStorage` (`useThemeStore`, `english-pathway-cookie-consent`) | Until cleared | Theme toggle; cookie banner; Settings analytics control |
| Optional analytics | Event names, bounded properties, session id | Client `trackEvent` after consent | Product quality metrics | `analytics_events` in Supabase | **24 months**, then eligible for purge (`purge_old_analytics_events`) | Decline analytics; change choice in Settings |
| Security telemetry | Injection/rate-limit signals (no learner content) | Server-side guards on assistant/tutor APIs | Abuse prevention | `analytics_events` (`security_injection_signal`, `security_rate_limit_hit`) | **24 months** | Essential service protection; not marketing analytics |

## Providers (operator confirmation required for locations/transfers)

| Provider | Used for | Code reference |
| --- | --- | --- |
| Supabase | Auth, PostgreSQL, RLS, optional file storage | `lib/supabase/*`, migrations |
| OpenAI | Embeddings, Realtime voice fallback, English Assistant | `lib/rag/embeddings.ts`, `app/api/tutor/realtime/route.ts`, `app/api/english-assistant/route.ts` |
| ElevenLabs | Primary voice tutor when `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is set | `components/voice/VoiceTutorProvider.tsx` |
| Clerk | Authentication and user session management | `@clerk/nextjs`, `lib/auth/clerk-sync.ts` |
| Google / GitHub OAuth | Social sign-in managed via Clerk Social Connections | Clerk Dashboard / `@clerk/nextjs` |

## Consent mechanisms

| Consent type | Implementation | Storage |
| --- | --- | --- |
| Terms + Privacy at registration | Checkbox on register; OAuth signed cookie | `user_consents` with `consent_method=registration` |
| Terms + Privacy on document update | Settings re-consent banner | `user_consents` with `consent_method=explicit_reconsent` |
| Optional analytics | Cookie banner + Settings control | `localStorage` only (not `user_consents`) |
| Cookies policy | Linked from banner and footer | Informational; no separate DB consent row |

## Gaps resolved in this implementation

| Gap | Resolution |
| --- | --- |
| English Assistant omitted from legal text | Added to Privacy Policy v1.2 |
| Analytics client/server enum mismatch | Server schema aligned with client event names |
| No analytics retention | `purge_old_analytics_events()` migration + 24-month policy text |
| No re-consent on version bump | `lib/auth/required-consent.ts` + Settings banner + middleware gate |
| OAuth redirect through onboarding | `resolvePostAuthDestination` preserves `?next=` |
| Account deletion | Documented email request to privacy contact (no self-service UI yet) |

## Outstanding operator actions

- Confirm legal entity name, privacy/support emails, and governing jurisdiction via [`operator-config.md`](./operator-config.md).
- Verify active social connections in Clerk Dashboard before production launch.
