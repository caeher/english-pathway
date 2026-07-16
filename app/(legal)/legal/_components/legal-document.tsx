import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LegalLayout } from '@/components/layouts'

interface LegalDocumentProps {
  title: string
  content: string
}

export function LegalDocument({ title, content }: LegalDocumentProps) {
  return (
    <LegalLayout title={title}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </LegalLayout>
  )
}
