import { getLegalDocument } from '@/lib/dal/content'
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents'
import { LegalDocument } from '../_components/legal-document'

export const metadata = {
  title: 'Terms of Service - English Pathway',
  description: 'Product terms for English Pathway learning, AI, and voice features.',
}

export default async function TermsPage() {
  const fallback = LEGAL_DOCUMENTS.find((document) => document.type === 'terms')!
  const doc = await getLegalDocument('terms')
  return <LegalDocument title={doc?.title ?? fallback.title} content={doc?.content ?? fallback.content} version={doc?.version ?? fallback.version} effectiveDate={doc?.published_at ?? fallback.effectiveDate} />
}
