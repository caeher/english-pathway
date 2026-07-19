# API contracts and use cases

API route handlers are transport adapters. They parse a feature-owned Zod contract, obtain the authentication context, invoke a framework-independent use case, and serialize the result. Business decisions and persistence orchestration live under `features/<name>`.

| API group | Endpoints | Contract and use-case owner |
| --- | --- | --- |
| Progress | `/api/progress/*`, `/api/curriculum/progress` | `features/progress` |
| SRS | `/api/srs`, `/api/srs/queue`, `/api/srs/due-count` | `features/srs` |
| Engagement | `/api/engagement/session`, `/api/engagement/daily-progress`, `/api/engagement/streak`, `/api/engagement/achievements` | `features/engagement` |
| Onboarding | `/api/onboarding/assessment` | `features/onboarding` |
| Tutor | `/api/tutor/context`, `/api/tutor/activity/*`, `/api/tutor/session`, `/api/tutor/memory` | `features/tutor` |

## Shared error contract

`lib/api/errors.ts` maps `DomainError` values to one response shape:

```json
{ "error": "Human-readable message", "code": "NOT_FOUND" }
```

The supported codes are `AUTHENTICATION_REQUIRED` (401), `INVALID_INPUT` (400), `NOT_FOUND` (404), `CONFLICT` (409), and `DEPENDENCY_FAILURE` (503). Unknown exceptions are logged server-side and exposed as a dependency failure without leaking provider or database details.

## Handler checklist

When adding an endpoint:

1. Define input and output schemas in the owning feature's `contracts.ts`.
2. Put business rules in a use-case function that accepts an authenticated context and validated input.
3. Keep the route responsible only for request parsing, authentication, and response adaptation.
4. Use `respondWithApiErrors` for consistent domain-error mapping.
5. Add unit coverage for invalid input, authorization, not-found/conflict rules, and the successful response contract.
