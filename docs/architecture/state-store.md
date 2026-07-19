# State-store boundaries

English Pathway uses Zustand for client-owned UI state only. Remote data remains owned by the API and Supabase data-access layers; it is not copied into a persisted client store.

## Ownership

| Store value | Owner | Persistence | Reset rule |
| --- | --- | --- | --- |
| Learning panel (`empty`, grammar, activity, question) | `DynamicContentPanel` and tutor tools | Ephemeral | Clear on close or page/session reset |
| Tutor state | Voice tutor session | Ephemeral | Starts at `preparing`; never restored from storage |
| Last activity id | Learning session | Persisted | Restore only a valid non-empty id; otherwise `null` |
| Last activity result | Learning session | Persisted | Restore only a valid 0–100 result; otherwise `null` |
| Theme preference | Theme store | Persisted | Invalid or unknown versions reset to light mode |
| Progress, SRS, profile, and engagement data | API/Supabase | Remote | Refetch from the server; no Zustand ownership |

## Store API rules

- Components subscribe through named selectors (`selectPanel`, `selectClearPanel`, `selectDark`, and similar), never to the complete store object.
- Imperative tutor tools use the named `learnSessionActions` facade rather than reaching into the store implementation.
- `resetSession` clears both ephemeral learning UI and persisted session markers.
- Persisted payloads are versioned. The current learning and theme payloads are version `1`; malformed data and future versions use safe defaults.

The migration functions are pure and covered by tests so hydration cannot crash the application when a previous session has an obsolete or malformed shape.
