export const LEGAL_DOCUMENTS = [
  {
    slug: 'terms',
    type: 'terms' as const,
    title: 'Terms of Service',
    version: '1.1',
    locale: 'en',
    effectiveDate: '2026-07-18',
    content: `# Terms of Service

**Effective date:** July 18, 2026 · **Version:** 1.1

These terms describe the English Pathway learning service. They are product-facing information and must be reviewed and approved by qualified legal counsel before production launch.

## 1. The service

English Pathway provides structured English curriculum, interactive exercises, optional voice sessions, text sessions, and learning progress features. AI-generated explanations are educational assistance, not professional advice or a guarantee of a particular learning outcome.

## 2. Accounts and acceptable use

Keep your account credentials private and provide accurate information. Do not attempt to access another learner's account, bypass access controls, submit malicious content, or use the service to infringe another person's rights.

## 3. AI, voice, and third-party services

Voice mode is optional. Your browser asks for microphone permission only after you choose voice mode and start a microphone check. The application does not save raw microphone audio or a full conversation transcript as learner memory. Voice and text sessions may be processed by the configured conversational AI provider, currently ElevenLabs when enabled; review that provider's terms and privacy information as well.

Text mode is available as an alternative when you do not want to use a microphone or when voice is unavailable. Curriculum retrieval may use OpenAI embeddings and Supabase-hosted shared curriculum data. Personalization uses only the private progress and bounded memory described in the Privacy Policy.

## 4. Curriculum and intellectual property

English Pathway curriculum, software, branding, and interface materials belong to their respective rights holders. You receive permission to use the service for personal learning. Do not republish or commercially redistribute protected materials without authorization.

## 5. Availability and changes

The service may change, be interrupted, or have features disabled. We may update these terms or providers and will publish a new version and request any consent required by applicable law.

## 6. Contact

For account or privacy questions, use the support/privacy contact published by the service operator before launch. This placeholder must be replaced with the operator's verified contact details during legal review.
`,
  },
  {
    slug: 'privacy',
    type: 'privacy' as const,
    title: 'Privacy Policy',
    version: '1.1',
    locale: 'en',
    effectiveDate: '2026-07-18',
    content: `# Privacy Policy

**Effective date:** July 18, 2026 · **Version:** 1.1

This product-facing summary explains what English Pathway processes. It is not a substitute for legal review. The service operator and privacy contact must be confirmed for the jurisdictions in which the service is offered.

## Data categories and purposes

| Category | Examples | Purpose | Retention |
| --- | --- | --- | --- |
| Account | Email, name, authentication identifiers | Create and secure your account | While the account exists, subject to legal obligations |
| Learning | Level, preferences, chapter/activity results, SRS items | Personalize lessons and show progress | While needed for the account; deletion is available for private tutor memory |
| Tutor memory | Short session summaries and bounded notes | Resume context and adapt help | Session summaries expire after 365 days; notes remain until deleted |
| Technical | Essential session cookies, theme preference | Sign-in, security, accessibility | Per session or until cleared |
| Optional analytics | Consent-scoped event names and bounded properties | Aggregate product quality metrics | Per the operator's approved analytics retention schedule |

## Voice, text, and AI processing

The browser requests microphone access only after a user gesture in voice mode. The application uses a microphone stream for the active voice experience and stops its tracks when the session ends. The application does not store raw audio or a full transcript in its learner memory tables. ElevenLabs may process voice conversations when voice is enabled; OpenAI may process embedding requests for shared curriculum retrieval when configured. Supabase hosts authentication, database, and shared curriculum retrieval. The exact provider terms, locations, transfer mechanisms, and subprocessors must be confirmed by the operator before launch.

Text mode is a functional alternative and does not request microphone access. Browser speech features used by optional activities follow the browser's own permission and provider behavior.

## Shared curriculum and private data

The curriculum knowledge base is shared canonical content and is not copied per learner. Progress, preferences, SRS data, tutor summaries, and learner memory are user-scoped with database row-level security. Server endpoints derive the user identity from the authenticated session and do not trust a client-supplied user ID.

## Your choices and rights

You can use text mode, decline optional analytics, export private tutor data from Settings, and delete private tutor summaries and memory notes from Settings. Requests for access, correction, account deletion, or other rights should be sent to the verified privacy contact for the operator. Legal timelines and exceptions depend on the applicable jurisdiction.

## Contact and review status

The operator must replace the placeholder privacy contact, confirm the legal basis for each processing purpose, document international transfer safeguards, and approve this version with counsel before launch.
`,
  },
  {
    slug: 'cookies',
    type: 'cookies' as const,
    title: 'Cookie and Storage Policy',
    version: '1.1',
    locale: 'en',
    effectiveDate: '2026-07-18',
    content: `# Cookie and Storage Policy

**Effective date:** July 18, 2026 · **Version:** 1.1

## Strictly necessary storage

Supabase authentication cookies and security/session storage are required to sign in and protect account actions. They cannot be disabled through the optional analytics choice.

## Preferences

The theme preference and the cookie-choice record are stored locally so the interface can remember accessibility and consent choices. These are not marketing cookies.

## Optional analytics

PostHog and product analytics requests are optional. They are not loaded or sent until you select **Allow analytics**. Selecting **Use essential only** keeps sign-in and learning available without optional analytics. You can change the choice by clearing the site's local storage or using the cookie preference control when provided by the operator.

## Microphone is not a cookie

Microphone permission is a browser permission, not a cookie. English Pathway requests it only after you choose voice mode and press a microphone or start control. Text mode does not request it.

The operator must confirm the provider list, retention, jurisdictional requirements, and contact details during legal review.
`,
  },
] as const

export type LegalDocument = typeof LEGAL_DOCUMENTS[number]
