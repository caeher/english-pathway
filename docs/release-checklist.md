# Release checklist

Use this checklist for every production release. Link the CI run, deployed preview, smoke-test evidence, and any exception decision in the pull request.

## Before merge

- [ ] `pnpm lint` passes with no errors.
- [ ] `pnpm test:critical` and `pnpm test` pass.
- [ ] `pnpm exec tsc --noEmit` passes.
- [ ] `pnpm quality:check` passes.
- [ ] `pnpm security:audit` passes; any moderate advisory has a tracked remediation decision.
- [ ] `pnpm build` succeeds with production-like environment placeholders.
- [ ] Migration and generated database types are reviewed together.
- [ ] No secrets, `.env.local`, transcripts, or personal data are committed.

## Staging smoke

- [ ] Environment variables are present: Supabase URL/anon key and app URL; ElevenLabs and OpenAI behavior is tested both configured and absent.
- [ ] Visitor → registration/confirmation → onboarding → Learn succeeds.
- [ ] Login/logout and password reset succeed.
- [ ] Curriculum activity completion and resume survive a reload.
- [ ] Text fallback works without ElevenLabs/RAG; voice permission denial is recoverable.
- [ ] Legal pages, cookie choice, consent version, export, and deletion behave as expected.
- [ ] Desktop and 390px mobile checks show no console errors, repeated failed requests, or active microphone tracks after session end.
- [ ] Keyboard/focus/contrast review and performance budgets have linked evidence.

## Go/no-go

Release owner: ____________________  Date: __________

- [ ] All required checks are green and evidence is linked.
- [ ] Security or accessibility exceptions have an owner, expiry date, and explicit approval.
- [ ] Rollback path is known (previous deployment and migration compatibility reviewed).
