# Asynchronous UI states

Primary asynchronous surfaces use the shared `components/ui/async-state.tsx` primitives.

| State | Component | Convention |
| --- | --- | --- |
| Loading | `LoadingState` | Contextual label plus fixed skeleton lines to reserve layout space |
| Empty | `EmptyState` | Explain why no content is visible and offer an optional next action |
| Recoverable failure | `InlineError` or route `FriendlyError` | Accessible alert plus a visible retry when the request can be repeated |
| Success | `SuccessState` | Brief confirmation with the next effect described |

Use route-level `loading.tsx` and `error.tsx` for server-rendered dashboard, curriculum, and learning routes. Client fetches use the same primitives directly; the review queue and chapter completion controls are the reference implementations.
