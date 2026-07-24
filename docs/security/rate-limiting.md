# Rate limiting and abuse controls

English Pathway protects expensive tutor and assistant APIs with durable, identity-aware rate limits.

## Storage

- Production uses Supabase PostgreSQL through the `consume_rate_limit` RPC and `rate_limit_buckets` table.
- Local development and tests fall back to an in-memory store when `SUPABASE_SERVICE_ROLE_KEY` is unavailable.
- Multiple app instances share the same counters through the database adapter.

## Identity keys

- Authenticated requests are keyed by `user:{sha256(userId)}:{route}`.
- Anonymous requests fall back to `ip:{clientIp}:{route}`.
- Keys are hashed before analytics events are recorded so rate-limit telemetry never stores raw user identifiers.

## Protected routes

| Route | Limit | Window |
|-------|-------|--------|
| `/api/english-assistant` | 12 | 60s |
| `/api/tutor/context` | 30 | 60s |
| `/api/tutor/realtime` | 6 | 60s |
| `/api/tutor/realtime/finish` | 20 | 60s |

Middleware enforces the shared store for every listed route. Chat and realtime handlers apply the same policy again for defense in depth and emit `security_rate_limit_hit` analytics when a request is blocked.

## Realtime safeguards

- SDP payloads are capped at 200,000 characters.
- Provider negotiation is bounded by the standard 10-second API timeout.
- Only one active realtime session per user is allowed through `audio_credit_sessions` concurrency checks plus credit-session RPC enforcement.

## Client contract

Blocked requests return:

```json
{ "error": "Too many requests. Please try again shortly.", "code": "RATE_LIMITED" }
```

The response includes a `Retry-After` header with the retry delay in seconds.

Regression coverage lives in `__tests__/security/rate-limit.test.ts`.
