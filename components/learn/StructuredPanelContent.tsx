'use client'

import { useEffect } from 'react'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { stopSpeaking } from '@/lib/audio/tts'
import type { PanelBlock } from '@/lib/tutor/panel-content'
import { cn } from '@/lib/helpers'

interface SpeakableTextProps {
  text: string
  label?: string
  className?: string
}

function SpeakableText({ text, label, className }: SpeakableTextProps) {
  return (
    <span className={cn('inline-flex items-start gap-2', className)}>
      <span className="flex-1">{text}</span>
      <SpeakButton text={text} size="sm" label={label ?? `Listen: ${text.slice(0, 40)}`} />
    </span>
  )
}

interface StructuredPanelContentProps {
  blocks: PanelBlock[]
  className?: string
}

export function StructuredPanelContent({ blocks, className }: StructuredPanelContentProps) {
  useEffect(() => () => stopSpeaking(), [blocks])

  return (
    <div className={cn('space-y-4 text-(--text-secondary)', className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            if (block.level === 2) {
              return (
                <h2 key={`heading-${index}`} className="font-display text-lg font-bold text-(--text-primary)">
                  {block.text}
                </h2>
              )
            }
            return (
              <h3 key={`heading-${index}`} className="font-display text-base font-semibold text-(--text-primary)">
                {block.text}
              </h3>
            )
          case 'paragraph':
            return (
              <p key={`paragraph-${index}`} className="text-sm leading-relaxed">
                <SpeakableText text={block.text} />
              </p>
            )
          case 'example':
            return (
              <blockquote
                key={`example-${index}`}
                className="border-l-4 border-(--accent) bg-(--accent-soft) px-4 py-3 text-sm italic text-(--text-primary)"
              >
                <SpeakableText text={block.text} label={`Example: ${block.text}`} />
              </blockquote>
            )
          case 'list':
            return (
              <ul key={`list-${index}`} className="list-disc space-y-1 pl-5 text-sm">
                {block.items.map((item, itemIndex) => (
                  <li key={`list-${index}-${itemIndex}`}>
                    <SpeakableText text={item} />
                  </li>
                ))}
              </ul>
            )
          case 'emphasis':
            return (
              <p
                key={`emphasis-${index}`}
                className="rounded-xl border border-(--border-primary) bg-(--bg-tertiary) px-4 py-3 text-sm font-medium text-(--text-primary)"
              >
                <SpeakableText text={block.text} />
              </p>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
