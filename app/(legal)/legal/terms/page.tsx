import { getLegalDocument } from '@/lib/dal/content'
import { LegalDocument } from '../_components/legal-document'

export const metadata = {
  title: 'Terms and Conditions — English Pathway',
}

const FALLBACK = {
  title: 'Terms and Conditions of Service',
  content: 'Terms and conditions will be available soon.',
}

export default async function TermsPage() {
  const doc = await getLegalDocument('terms')
  return <LegalDocument title={doc?.title ?? FALLBACK.title} content={doc?.content ?? FALLBACK.content} />
}
