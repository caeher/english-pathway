'use client'

/* Markdown images are author-controlled content and cannot use a static Next Image loader. */
/* eslint-disable @next/next/no-img-element */

import { memo, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { slugifyHeading } from '@/lib/content/markdown'
import { stopSpeaking } from '@/lib/audio/tts'

const ENGLISH_PATTERN = /\*([a-zA-Z][a-zA-Z\s',.-]{0,40})\*/g

function EnglishWord({ word }: { word: string }) {
  return (
    <span className="markdown-word inline-flex items-center gap-1 align-middle">
      <em className="font-medium italic text-(--text-primary)">{word}</em>
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
      if (match.index > lastIndex) parts.push(children.slice(lastIndex, match.index))
      parts.push(<EnglishWord key={`${match.index}-${match[1]}`} word={match[1]} />)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < children.length) parts.push(children.slice(lastIndex))
    return parts.length > 0 ? parts : children
  }

  if (Array.isArray(children)) return children.map((child) => processChildren(child))
  return children
}

function plainChildren(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(plainChildren).join(' ')
  if (children && typeof children === 'object' && 'props' in children) {
    return plainChildren((children as { props?: { children?: React.ReactNode } }).props?.children)
  }
  return ''
}

function calloutClass(children: React.ReactNode): string {
  const label = plainChildren(children).match(/^(Tip|Important|Example|Remember):/i)?.[1].toLowerCase()
  return label ? `markdown-callout markdown-callout-${label}` : 'markdown-blockquote'
}

const markdownPlugins = [remarkGfm]

interface MarkdownWithTtsProps {
  content: string
  className?: string
}

const MarkdownDocument = memo(function MarkdownDocument({ content }: Pick<MarkdownWithTtsProps, 'content'>) {
  const headingCounts = new Map<string, number>()
  const headingId = (children: React.ReactNode) => {
    const baseId = slugifyHeading(plainChildren(children))
    const count = headingCounts.get(baseId) ?? 0
    headingCounts.set(baseId, count + 1)
    return count === 0 ? baseId : `${baseId}-${count + 1}`
  }

  return (
    <>
      <ReactMarkdown
        remarkPlugins={markdownPlugins}
        components={{
          h1: ({ children }) => <h1 id={headingId(children)}>{processChildren(children)}</h1>,
          h2: ({ children }) => <h2 id={headingId(children)}>{processChildren(children)}</h2>,
          h3: ({ children }) => <h3 id={headingId(children)}>{processChildren(children)}</h3>,
          h4: ({ children }) => <h4 id={headingId(children)}>{processChildren(children)}</h4>,
          p: ({ children }) => <p>{processChildren(children)}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{processChildren(children)}</li>,
          strong: ({ children }) => <strong>{processChildren(children)}</strong>,
          em: ({ children }) => <em>{processChildren(children)}</em>,
          a: ({ href, children, title }) => <a href={href} title={title}>{processChildren(children)}</a>,
          blockquote: ({ children }) => <blockquote className={calloutClass(children)}>{children}</blockquote>,
          code: ({ children, className: codeClass }) => <code className={codeClass}>{children}</code>,
          table: ({ children }) => <div className="markdown-table-wrap" role="region" aria-label="Learning reference table" tabIndex={0}><table>{children}</table></div>,
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          th: ({ children }) => <th scope="col">{processChildren(children)}</th>,
          td: ({ children }) => <td>{processChildren(children)}</td>,
          hr: () => <hr />,
          img: ({ src, alt, title }) => <img src={src} alt={alt ?? ''} title={title} loading="lazy" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </>
  )
})

export function MarkdownWithTts({ content, className }: MarkdownWithTtsProps) {
  useEffect(() => () => stopSpeaking(), [content])
  return <div className={`markdown-content ${className ?? ''}`}><MarkdownDocument content={content} /></div>
}
