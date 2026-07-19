# Contributing to English Pathway

Thank you for improving English Pathway. This guide covers the expected workflow for code, curriculum, and database changes.

## Before you start

- Use Node.js 22+ and pnpm 10+.
- Install dependencies with `pnpm install`.
- Copy the environment setup described in [README.md](README.md). Local Supabase requires Docker Desktop.
- Keep `.env.local` and all credentials out of commits.

Create a branch from the current `main` branch. Use a concise branch name that describes the change, for example `fix/login-redirect`.

## Development and validation

Run the smallest relevant checks while developing, then run the standard checks before opening a pull request:

```bash
pnpm lint
pnpm test
pnpm build
```

Useful focused checks are:

```bash
pnpm architecture:check
pnpm activities:validate
pnpm test:critical
pnpm quality:check
```

`pnpm quality:check` runs the critical test suite and the repository quality gate. Use `pnpm security:audit` when changing production dependencies.

## Code and UI conventions

- Keep TypeScript strict and prefer the existing feature, component, DAL, and utility boundaries.
- Use the App Router conventions already present in `app/`.
- Validate API input with Zod and put data access behind `lib/dal/`.
- Keep user-facing UI copy in English; there is no i18n layer.
- Add or update Vitest coverage for behavior that could regress.
- Do not add roles or a CMS for curriculum changes: the application uses the file-based knowledge base.

## Curriculum changes

The canonical curriculum lives in `knowledge/`, not in legacy database tables.

1. Update the relevant `knowledge/modules/<module>/chapters/<chapter>/chapter.md` and, when applicable, its `activities.json`.
2. Run `pnpm activities:validate` after activity changes.
3. Run `pnpm kb:embed` to refresh RAG embeddings. This requires `OPENAI_API_KEY` in `.env.local`; report in the pull request if it could not be run.
4. Include the learner-facing impact and any validation performed in the pull request.

## Database changes

1. Add an additive migration under `supabase/migrations/`; do not edit an already-applied migration.
2. Start or reset the local stack as needed with `pnpm db:start` or `pnpm db:reset`.
3. Regenerate local database types with `pnpm db:types` when the schema changes.
4. Update RLS policies, seed data, and tests when the change requires them.
5. State migration, rollback, and data-impact details in the pull request.

`pnpm db:reset` deletes local Supabase data. Do not run it against data you need to keep.

## Pull requests

Use the pull-request template. Keep each pull request focused, link its issue, and describe:

- What changed and why.
- The validation actually run, including any checks that were not run.
- Curriculum, embeddings, migration, RLS, or data impact.
- Screenshots or recordings for visible UI changes.

Do not merge changes with failing required checks. Review comments should be resolved before merge.

## Security

Report suspected vulnerabilities privately to the maintainers rather than opening a public issue with exploitable details. Never commit API keys, service-role keys, tokens, or `.env.local` files.
