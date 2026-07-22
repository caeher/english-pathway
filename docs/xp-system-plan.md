# XP system plan

## Objective

Keep XP accurate, idempotent, and consistent across activity completion, daily progress, streaks, achievements, the learning header, and the dashboard.

## Completion flow

1. An activity completes in `ActivityRenderer` and reaches `useTutorActivityActions`.
2. The client saves learning progress and posts the activity ID, type, score, and timezone to `/api/engagement/session`.
3. The server validates the activity against the knowledge base and calculates its base XP; the browser never chooses that amount.
4. `record_engagement_session` records the activity once per user, updates lifetime XP, streak, and daily counters, then unlocks achievements.
5. Every newly unlocked achievement adds its configured `xp_reward` once. The RPC returns the base, achievement, and combined XP amounts with the refreshed totals.
6. The `engagement:updated` browser event refreshes the learning header and displays achievement feedback. The dashboard renders the same persisted lifetime total.

## Delivered safeguards

- Unique `(user_id, activity_id)` awards make repeated submits and retries idempotent.
- The database validates the RPC's amount, score, duration, date, and activity ID to protect counters from invalid direct calls.
- Achievement XP is now included in both `user_engagement.total_xp` and `daily_sessions.xp_earned`.
- Achievement awarding is conflict-safe and recalculates eligibility after each award, so threshold chains are resolved in one completion.
- The learning header now reads `minutesStudied`, the actual API field, instead of an undefined field.
- XP and level helpers safely handle non-finite values and preserve a usable interface.

## Operating checklist

- Apply migrations before deploying the application code.
- Run `pnpm test -- __tests__/engagement` and `pnpm lint` for each XP change.
- For a database change, run the local Supabase migration test (`pnpm db:reset`) and validate a first activity, a retry, a perfect activity, and an achievement threshold.
- Treat activity score and time as client-reported engagement signals. If XP becomes redeemable or competitive, move completion verification to a server-authoritative activity-attempt model before assigning value to it.
