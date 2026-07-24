# First-party observability runbook

English Pathway records consent-scoped product events in `analytics_events`; it does not load or forward events to PostHog. The browser session ID is the correlation identifier shared by UI events and the first-party analytics route. It is scoped to the browser tab and is not a user ID.

## Critical-flow signals

| Flow | Completion signal | Failure signal | Safe context |
| --- | --- | --- | --- |
| Tutor launch | `learn_session_start` | `learn_session_error` | mode, reason |
| Activity completion | `activity_complete` | `learn_session_error` | activity type, score bucket, operation |
| Progress persistence | activity completion | `learn_session_error` | `progress_save`, route failure |
| Engagement and review handoff | activity completion / `srs_review_complete` | `learn_session_error` | `engagement_record` or `review_enqueue` |

## Activity UX metrics

Activity lifecycle events are emitted from the runtime bridge in `lib/analytics/activity-runtime.ts`. They never include dictation text, transcripts, audio payloads, or learner answers.

| Signal | Event | Safe properties |
| --- | --- | --- |
| Activity opened | `activity_started` | `activity_id`, `activity_type`, `chapter_id`, `module_id` |
| First item attempt | `activity_first_attempt` | `item_index`, `correct` |
| Wrong item attempt | `activity_item_error` | `item_index` |
| Hint usage | `hint_requested` | `level`, `item_index`, `source` |
| Retry | `activity_retry` | activity identifiers only |
| Abandon / skip | `activity_abandon` | `reason` |
| Completion | `activity_complete` | `score_percent` |

Suggested index for aggregate reads:

```sql
CREATE INDEX IF NOT EXISTS idx_analytics_events_activity_type_created
  ON public.analytics_events (event_name, ((properties->>'activity_type')), created_at DESC);
```

Reference queries live in [`scripts/activity-ux-queries.sql`](../scripts/activity-ux-queries.sql).

To investigate a report, obtain the browser session ID from consented diagnostic evidence, then query event names, timestamps, `properties->>'operation'`, and `properties->>'reason'` for that session. Do not query or request learner messages, voice data, raw answers, prompts, memory, email addresses, or full activity payloads.

## Retention and privacy

Analytics reads are owner-scoped by RLS. Event properties reject keys that could carry learner content or identifiers, both in the client helper and in the server schema. Retain only aggregate operational events for the product retention period; deletion/export requests follow the existing account-data workflow. Review this document whenever adding an event or property.
