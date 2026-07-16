'use client'

import { useState, useCallback } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { getTtsSupported, speak, stopSpeaking } from '@/lib/audio/tts'

interface SpeakButtonProps {
  text: string
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function SpeakButton({ text, label, size = 'sm', className }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false)
  const supported = getTtsSupported()

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (!supported) return

      if (speaking) {
        stopSpeaking()
        setSpeaking(false)
        return
      }

      const ok = speak(text, {
        onEnd: () => setSpeaking(false),
      })
      if (ok) setSpeaking(true)
    },
    [text, speaking, supported]
  )

  if (!supported) return null

  const sizeClasses = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label ?? `Pronunciar: ${text}`}
      aria-pressed={speaking}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
        speaking
          ? 'border-(--accent) bg-(--accent-soft) text-(--accent)'
          : 'border-(--border-primary) bg-(--bg-card) text-(--text-muted) hover:border-(--accent)/50 hover:text-(--accent)',
        sizeClasses,
        className
      )}
    >
      {speaking ? <VolumeX className={iconSize} /> : <Volume2 className={iconSize} />}
    </button>
  )
}
