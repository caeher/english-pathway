'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SpeakButton } from '@/components/ui/SpeakButton'

const ENGLISH_PATTERN = /\*([a-zA-Z][a-zA-Z\s',.-]{0,40})\*/g

function EnglishWord({ word }: { word: string }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <em className="text-(--text-secondary) italic not-italic font-medium text-(--text-primary)">{word}</em>
      <SpeakButton text={word} size="sm" label={`Pronounce ${word}`} />
    </span>
  )
}

function processChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    const regex = new RegExp(ENGLISH_PATTERN)
    while ((match = regex.exec(children)) !== null) {
      if (match.index > lastIndex) {
        parts.push(children.slice(lastIndex, match.index))
      }
      parts.push(<EnglishWord key={`${match.index}-${match[1]}`} word={match[1]} />)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < children.length) parts.push(children.slice(lastIndex))
    return parts.length > 0 ? parts : children
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => <span key={i}>{processChildren(child)}</span>)
  }

  return children
}

interface MarkdownWithTtsProps {
  content: string
  className?: string
}

export function MarkdownWithTts({ content, className }: MarkdownWithTtsProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          em: ({ children }) => <>{processChildren(children)}</>,
          p: ({ children }) => <p>{processChildren(children)}</p>,
          li: ({ children }) => <li>{processChildren(children)}</li>,
          td: ({ children }) => <td>{processChildren(children)}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
