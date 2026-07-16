import { getLegalDocument } from '@/lib/dal/content'
import { LegalDocument } from '../_components/legal-document'

export const metadata = {
  title: 'Privacy Policy — English Pathway',
}

const FALLBACK = {
  title: 'Privacy Policy',
  content: 'The privacy policy will be available soon.',
}

export default async function PrivacyPage() {
  const doc = await getLegalDocument('privacy')
  return <LegalDocument title={doc?.title ?? FALLBACK.title} content={doc?.content ?? FALLBACK.content} />
}
