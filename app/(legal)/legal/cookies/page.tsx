import { getLegalDocument } from '@/lib/dal/content'
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents'
import { LegalDocument } from '../_components/legal-document'

export const metadata = {
  title: 'Cookie and Storage Policy - English Pathway',
  description: 'Essential storage, preferences, and optional analytics choices in English Pathway.',
}

export default async function CookiesPage() {
  const fallback = LEGAL_DOCUMENTS.find((document) => document.type === 'cookies')!
  const doc = await getLegalDocument('cookies')
  return <LegalDocument title={doc?.title ?? fallback.title} content={doc?.content ?? fallback.content} version={doc?.version ?? fallback.version} effectiveDate={doc?.published_at ?? fallback.effectiveDate} />
}
