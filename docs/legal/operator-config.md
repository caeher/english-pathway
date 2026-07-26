# Legal operator configuration

English Pathway legal documents read operator details from environment variables at build/seed time. **Do not invent contacts in code** — set these in deployment secrets or `.env.local` before publishing updated legal text.

| Variable | Purpose | Example |
| --- | --- | --- |
| `LEGAL_OPERATOR_NAME` | Legal entity operating the service | `English Pathway` |
| `LEGAL_PRIVACY_CONTACT_EMAIL` | Privacy and data-rights requests | `privacy@english-pathway.caeher.com` |
| `LEGAL_SUPPORT_CONTACT_EMAIL` | Account and product support | `support@english-pathway.caeher.com` |
| `LEGAL_GOVERNING_JURISDICTION` | Governing law statement | `Republic of El Salvador` |

## Release gate

Before marking issue **#161** complete:

1. Confirm the four variables above with the service operator and qualified counsel.
2. Complete [`legal-review-checklist.md`](../legal-review-checklist.md).
3. Record approver name, date, and document version in your ops log (not in git if it contains personal data).
4. Run `pnpm db:seed` (or the production seed process) after updating `lib/legal/documents.ts` so `legal_documents` matches the published version.

If any variable is missing at runtime, `lib/legal/operator.ts` falls back to product-facing defaults derived from `NEXT_PUBLIC_APP_URL` hostnames. Replace those defaults in production deployments.
