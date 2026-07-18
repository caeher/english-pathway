import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LegalLayout } from '@/components/layouts'

interface LegalDocumentProps {
  title: string
  content: string
  version: string
  effectiveDate: string
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

export function LegalDocument({ title, content, version, effectiveDate }: LegalDocumentProps) {
  return (
    <LegalLayout title={title}>
      <div className="mb-8 border-b border-(--border-primary) pb-5 text-sm text-(--text-muted)">
        <span>Effective {formatDate(effectiveDate)}</span><span aria-hidden="true"> · </span><span>Version {version}</span>
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </LegalLayout>
  )
}
