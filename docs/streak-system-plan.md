# Streak system plan

## Definition

A **current streak** is the number of consecutive learner-local calendar days
ending today or yesterday on which the learner completed at least one activity.
The streak starts at one after a gap. `longest_streak` is historical and never
decreases.

## Source of truth and data flow

1. Every game completion reaches `useTutorActivityActions`; both voice tutor
providers use this shared hook.
2. The authenticated API validates the activity from `knowledge/`, derives XP
on the server, and calculates the learner-local date from the browser timezone.
3. `engagement_activity_sessions` accepts one `(user, activity, local day)`
record. It makes retries harmless and lets a repeated activity on a later day
count as real practice.
4. `engagement_activity_awards` remains one `(user, activity)` record, so the
same activity cannot be used to earn base XP repeatedly.
5. The database RPC updates `user_engagement`, `daily_sessions`, and
achievement rewards atomically. Its response refreshes the learning header.
6. Read paths calculate whether the stored streak is still active for the
learner's timezone. A missed day renders as zero without waiting for another
activity to be completed.

## Invariants

- A retry on the same activity and local date changes neither XP nor counters.
- A repeated activity on a later local date can extend or restart a streak and
  add daily practice time, but it awards no base XP.
- One new activity session may advance a streak by at most one day.
- `longest_streak >= current_streak` in stored state; the displayed current
  streak is zero after a missed day.
- The client never chooses an XP amount or an activity definition.

## Deployment and verification

1. Apply migrations in order, including `20260722120000_fix_engagement_xp_awards.sql`
   and `20260722130000_fix_streak_daily_sessions.sql`.
2. Regenerate Supabase types with `pnpm db:types` after the migration is
   applied. The checked-in type file includes the new table for local builds.
3. Run `pnpm test -- __tests__/engagement __tests__/dashboard`, `pnpm lint`,
   and `pnpm build`.
4. On a disposable local database, verify these cases through the RPC/API:
   first activity, same-day retry, next-day repeat of the same activity,
   activity after a two-day gap, and a timezone boundary around midnight.
5. Monitor `learn_session_error` events after release. The XP and time inputs
   are engagement signals; if rewards become redeemable or competitive, move
   activity-completion proof to a server-authoritative attempt model.
