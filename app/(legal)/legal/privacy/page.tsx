import { getLegalDocument } from '@/lib/dal/content'
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents'
import { LegalDocument } from '../_components/legal-document'

export const metadata = {
  title: 'Privacy Policy - English Pathway',
  description: 'How English Pathway handles account, learning, voice, AI, and analytics data.',
}

export default async function PrivacyPage() {
  const fallback = LEGAL_DOCUMENTS.find((document) => document.type === 'privacy')!
  const doc = await getLegalDocument('privacy')
  return <LegalDocument title={doc?.title ?? fallback.title} content={doc?.content ?? fallback.content} version={doc?.version ?? fallback.version} effectiveDate={doc?.published_at ?? fallback.effectiveDate} />
}
