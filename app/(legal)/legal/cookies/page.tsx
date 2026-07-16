import { getLegalDocument } from '@/lib/dal/content'
import { LegalDocument } from '../_components/legal-document'

export const metadata = {
  title: 'Cookie Policy — English Pathway',
}

const FALLBACK = {
  title: 'Cookie Policy',
  content: 'The cookie policy will be available soon.',
}

export default async function CookiesPage() {
  const doc = await getLegalDocument('cookies')
  return <LegalDocument title={doc?.title ?? FALLBACK.title} content={doc?.content ?? FALLBACK.content} />
}
