# Feature boundaries

English Pathway remains a single Next.js deployment, but its core capabilities have explicit owners and public entry points. Code outside a feature should depend on that feature's public API rather than its technical-layer files.

| Feature | Owns | Public API |
| --- | --- | --- |
| `learn` | Tutor session orchestration, activity resolution, and activity tools | `@/features/learn` |
| `curriculum` | Knowledge-backed modules, chapters, navigation, and curriculum progress calculations | `@/features/curriculum` |
| `progress` | Guest persistence, progress contracts, server writes, resume state, and chapter completion | `@/features/progress` |
| `engagement` | XP, streak and daily-goal calculations, and engagement client operations | `@/features/engagement` |
| `onboarding` | Onboarding drafts, completion, assessment, and related validation | `@/features/onboarding` |
| `account` | Authenticated profile settings and account actions | `@/features/account` |

## Dependency rules

- A consumer imports a feature through its `features/<name>/index.ts` entry point.
- Technical-layer modules remain implementation details and may be imported by their owning feature.
- The protected progress slice rejects imports of `lib/api/progress-schemas`, `lib/progress`, and the progress DALs from outside their owner or public API.
- New boundaries are added to `scripts/check-feature-boundaries.mjs` as each vertical slice is migrated.

Run the check locally with:

```bash
pnpm architecture:check
```

The check runs in CI before linting. This keeps the migration incremental while making accidental backsliding fail fast.
