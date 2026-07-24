# Activity quality review sample (issue #129)

Manual review of 10 stratified chapters using `pnpm activities:quality-report` and the editorial rubric in `features/activities/quality/`.

Scoring dimensions: observable objective, comprehensible input, learner response, feedback, difficulty, accessibility, mastery evidence.

| Chapter | Score | Decision | Key findings | Next action |
| --- | ---: | --- | --- | --- |
| `m1-ch1` | 93 | **keep** | Reference bundle + `minimal-pairs` pilot; duplicate vocabulary across flashcard/word-match/scramble | Keep pilot; migrate duplicate terms to chapter-specific distractors in a later editorial pass |
| `m1-ch4` | 96 | **keep** | Strong phonetics focus; word-match/sentence-builder lack per-item feedback (type limitation) | Keep; monitor UX metrics after instrumentation |
| `m2-ch3` | 93 | **migrate** | Past-tense grammar solid; repeated lemmas across flashcard and word-match | Migrate word-match pairs to less overlapping forms while preserving chapter alignment |
| `m4-ch1` | 89 | **migrate** | Adverb chapter; highest duplicate overlap in sample | Migrate flashcard vs word-match overlap (slowly/quickly/happily) |
| `m6-ch4` | 95 | **keep** | Connector chapter; generic listening title only advisory finding | Keep; replace template listening title when editing module 6 |
| `m8-ch1` | 91 | **migrate** | Restaurant vocabulary; bilingual pairs duplicated across activities | Migrate word-match to scenario prompts instead of reusing flashcard lemmas |
| `m9-ch2` | 90 | **migrate** | Dialogue focus; duplicate verb lemmas across activities | Migrate overlapping swim/write pairs; keep listening/pronunciation bundle |
| `m11-ch3` | 95 | **keep** | Writing/production chapter; no duplicate-content warnings | Keep |
| `m13-ch4` | 95 | **keep** | Email/note chapter; bundle complete | Keep |
| `m14-ch5` | 95 | **keep** | Curriculum closing chapter; bundle complete | Keep |

## Summary

- **Keep:** 6 chapters (no structural blockers; scores ≥ 93 except `m4-ch1` which is migrate-priority)
- **Migrate:** 4 chapters (`m2-ch3`, `m4-ch1`, `m8-ch1`, `m9-ch2`) — reduce cross-activity duplicate lemmas
- **Retire:** 0 chapters in this sample

No retired activity types (`svg-scene`) were found in the sample. Blocking validation errors were absent; findings are advisory and tracked by the rubric for periodic review.

## Follow-up

1. Run `pnpm activities:quality-report` after major curriculum edits.
2. Use `scripts/activity-ux-queries.sql` to compare completion, first-attempt accuracy, retries, and abandonment once production traffic accumulates.
3. Revisit **migrate** chapters when editing their `activities.json` bundles.
