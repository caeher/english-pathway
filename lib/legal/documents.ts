import { formatLegalContactBlock, getLegalOperatorConfig } from '@/lib/legal/operator'

const EFFECTIVE_DATE = '2026-07-26'
const VERSION = '1.2'

function buildTermsContent(contactBlock: string): string {
  return `# Terms of Service

**Effective date:** July 26, 2026 · **Version:** ${VERSION}

These Terms of Service ("Terms") govern your use of English Pathway, operated by the service provider identified below. By creating an account or using the service, you agree to these Terms and to our Privacy Policy.

${contactBlock}

## 1. The service

English Pathway provides structured English curriculum, interactive exercises, optional voice and text tutoring on \`/learn\`, an authenticated English Assistant chat on \`/chats\`, and learning progress features. AI-generated explanations are educational assistance only. They are not professional, legal, medical, or immigration advice and do not guarantee a particular learning outcome.

## 2. Accounts and acceptable use

You must provide accurate account information and keep your credentials secure. You may register with email and password and, when enabled in your environment, with Google sign-in. GitHub sign-in appears only when explicitly enabled by the operator.

Do not attempt to access another person's account, bypass access controls, submit malicious content, interfere with the service, or use English Pathway to infringe another person's rights.

## 3. AI, voice, and third-party services

Voice mode is optional. Your browser requests microphone access only after you choose voice mode and start a microphone check or voice session. The application does not store raw microphone audio in its learner memory tables.

Voice and text tutor sessions may be processed by ElevenLabs when configured, or by OpenAI Realtime as a fallback voice provider. Text mode is available when you do not want to use a microphone or when voice is unavailable.

The English Assistant stores your conversation messages so you can continue chats across sessions. OpenAI processes assistant requests on the operator's behalf.

Curriculum retrieval may use OpenAI embeddings and Supabase-hosted shared curriculum data. Personalization uses only the private progress and bounded memory described in the Privacy Policy.

## 4. Curriculum and intellectual property

English Pathway curriculum, software, branding, and interface materials belong to their respective rights holders. You receive a personal, non-transferable permission to use the service for learning. Do not republish or commercially redistribute protected materials without authorization.

## 5. Availability and changes

The service may change, be interrupted, or have features disabled. We may update these Terms, providers, or pricing with notice when required by law. Material changes may require renewed acceptance in the product.

## 6. Account termination and contact

You may stop using the service at any time. To request account deletion or exercise privacy rights, contact the privacy email above. The operator may suspend or terminate accounts that violate these Terms or create security risk.

For account, support, or privacy questions, use the contacts listed at the top of this document.
`
}

function buildPrivacyContent(contactBlock: string): string {
  return `# Privacy Policy

**Effective date:** July 26, 2026 · **Version:** ${VERSION}

This Privacy Policy explains how English Pathway processes personal data. It applies to the website, authenticated account areas, learning sessions, and the English Assistant.

${contactBlock}

## Data categories and purposes

| Category | Examples | Purpose | Retention |
| --- | --- | --- | --- |
| Account | Email, name, authentication identifiers, OAuth provider metadata when enabled | Create and secure your account | While the account exists, subject to legal obligations |
| Profile & learning | Level, daily goal, preferred mode, native language, chapter/activity results, SRS items | Personalize lessons and show progress | While the account exists |
| Tutor memory | Short session summaries and bounded notes | Resume tutor context | Summaries expire after 365 days; notes remain until you delete them |
| English Assistant | Conversation titles, message text, prompt metadata | Provide chat history and improve session quality | While the account exists unless you delete conversations |
| Technical | Essential session cookies, theme preference | Sign-in, security, accessibility | Per session or until cleared |
| Optional analytics | Consent-scoped event names and bounded properties | Aggregate product quality metrics | Up to 24 months, then eligible for deletion |
| Security telemetry | Abuse-prevention signals without learner content | Protect accounts and APIs | Up to 24 months |

## Authentication

Email/password authentication is always available when enabled by the operator. Google sign-in is offered only when configured in Supabase and exposed in the UI. GitHub sign-in follows the same rule when enabled.

## Voice, text, and AI processing

The browser requests microphone access only after a user gesture in voice mode. The application uses a microphone stream for the active voice experience and stops its tracks when the session ends. The application does not store raw audio or a full tutor transcript in its learner memory tables.

ElevenLabs may process voice conversations when configured. When ElevenLabs is not configured, OpenAI may process realtime voice conversations and embedding requests for shared curriculum retrieval. OpenAI also processes English Assistant prompts and responses. Supabase hosts authentication, relational data, and shared curriculum retrieval.

Text mode is a functional alternative and does not request microphone access. Optional browser speech features used by activities follow the browser's own permission behavior.

## Shared curriculum and private data

The curriculum knowledge base is shared canonical content and is not copied per learner. Progress, preferences, SRS data, tutor summaries, learner memory, and English Assistant conversations are user-scoped with database row-level security. Server endpoints derive user identity from the authenticated session and do not trust a client-supplied user ID.

## Analytics and cookies

Optional product analytics run only after you choose **Allow analytics** in the cookie banner. You can switch back to essential-only storage from Settings. Security telemetry that protects the service may be recorded without marketing identifiers or learner content.

See the Cookie and Storage Policy for details on local storage keys and essential cookies.

## International transfers

Data may be processed in countries where Supabase, OpenAI, ElevenLabs, or OAuth providers operate. The operator relies on provider terms and applicable transfer safeguards. Contact the privacy email for jurisdiction-specific information.

## Your choices and rights

You can use text mode, decline optional analytics, export private tutor data from Settings, delete private tutor summaries and memory notes from Settings, and delete English Assistant conversations in the chat UI.

Requests for access, correction, account deletion, or other privacy rights should be sent to the privacy contact above. The operator will respond within timelines required by applicable law.

## Changes

When we publish a new version of this policy, we update the version and effective date shown on this page. Material changes may require renewed acceptance before continued use of authenticated features.
`
}

function buildCookiesContent(contactBlock: string): string {
  return `# Cookie and Storage Policy

**Effective date:** July 26, 2026 · **Version:** ${VERSION}

This policy describes cookies and similar browser storage used by English Pathway.

${contactBlock}

## Strictly necessary storage

Supabase authentication cookies and security/session storage are required to sign in and protect account actions. They cannot be disabled through the optional analytics choice.

## Preferences

The theme preference and the cookie-choice record are stored locally so the interface can remember accessibility and consent choices. These are not marketing cookies.

| Storage key | Purpose |
| --- | --- |
| Theme store (Zustand persist) | Remember light/dark mode |
| \`english-pathway-cookie-consent\` | Remember essential-only vs analytics choice |
| \`ie-analytics-session\` (sessionStorage) | Anonymous session id for optional analytics |

## Optional analytics

Product analytics requests are optional. They are not sent until you select **Allow analytics**. Selecting **Use essential only** keeps sign-in and learning available without optional analytics. You can change the choice from Settings or by clearing the site's local storage for this origin.

Optional analytics events are stored in the operator's Supabase project for up to 24 months.

## Essential security telemetry

The service may record limited security events (for example rate-limit or injection-signal events) without learner message content. These events protect the service and are not used for advertising.

## Microphone is not a cookie

Microphone permission is a browser permission, not a cookie. English Pathway requests it only after you choose voice mode and press a microphone or start control. Text mode and the English Assistant text interface do not require microphone access.

## Contact

Questions about this policy can be sent to the privacy contact listed above.
`
}

export function buildLegalDocuments() {
  const operator = getLegalOperatorConfig()
  const contactBlock = formatLegalContactBlock(operator)

  return [
    {
      slug: 'terms',
      type: 'terms' as const,
      title: 'Terms of Service',
      version: VERSION,
      locale: 'en',
      effectiveDate: EFFECTIVE_DATE,
      content: buildTermsContent(contactBlock),
    },
    {
      slug: 'privacy',
      type: 'privacy' as const,
      title: 'Privacy Policy',
      version: VERSION,
      locale: 'en',
      effectiveDate: EFFECTIVE_DATE,
      content: buildPrivacyContent(contactBlock),
    },
    {
      slug: 'cookies',
      type: 'cookies' as const,
      title: 'Cookie and Storage Policy',
      version: VERSION,
      locale: 'en',
      effectiveDate: EFFECTIVE_DATE,
      content: buildCookiesContent(contactBlock),
    },
  ] as const
}

export const LEGAL_DOCUMENTS = buildLegalDocuments()

export type LegalDocument = ReturnType<typeof buildLegalDocuments>[number]
