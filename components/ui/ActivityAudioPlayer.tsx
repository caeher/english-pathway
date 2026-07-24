'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw, Volume2 } from 'lucide-react'
import type { CuratedAudio } from '@/types'
import {
  formatAudioMetadata,
  getAudioModeLabel,
  PLAYBACK_RATES,
  resolveActivityAudioSource,
  type PlaybackRate,
} from '@/lib/audio/curated-audio'
import { getTtsSupported, speak, stopSpeaking } from '@/lib/audio/tts'
import { cn } from '@/lib/helpers'

interface ActivityAudioPlayerProps {
  fallbackText: string
  curated?: CuratedAudio
  mode?: 'guided' | 'evaluation'
  autoPlay?: boolean
  className?: string
  onUserInteraction?: () => void
}

export function ActivityAudioPlayer({
  fallbackText,
  curated,
  mode,
  autoPlay = false,
  className,
  onUserInteraction,
}: ActivityAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const resolved = resolveActivityAudioSource({ fallbackText, curated, mode })
  const [rate, setRate] = useState<PlaybackRate>(() => {
    const defaultRate = resolved.defaultRate
    return PLAYBACK_RATES.includes(defaultRate as PlaybackRate) ? defaultRate as PlaybackRate : 1
  })
  const [playing, setPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const ttsSupported = getTtsSupported()

  const applyRate = useCallback((nextRate: PlaybackRate) => {
    setRate(nextRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }, [])

  const playCurated = useCallback(async () => {
    const element = audioRef.current
    if (!element || !resolved.src) return false

    stopSpeaking()
    element.playbackRate = rate
    try {
      await element.play()
      setPlaying(true)
      return true
    } catch {
      setPlaying(false)
      return false
    }
  }, [rate, resolved.src])

  const playTts = useCallback(() => {
    if (!ttsSupported) return false
    stopSpeaking()
    const ok = speak(fallbackText, {
      rate: rate === 0.75 ? 0.75 : rate === 1.25 ? 1.1 : 0.9,
      onEnd: () => setPlaying(false),
    })
    if (ok) setPlaying(true)
    return ok
  }, [fallbackText, rate, ttsSupported])

  const play = useCallback(async () => {
    onUserInteraction?.()
    setHasInteracted(true)

    if (resolved.hasCuratedAudio) {
      const ok = await playCurated()
      if (ok) return
    }

    playTts()
  }, [onUserInteraction, playCurated, playTts, resolved.hasCuratedAudio])

  const replay = useCallback(() => {
    void play()
  }, [play])

  useEffect(() => {
    const element = audioRef.current
    if (!element) return undefined

    const handleEnded = () => setPlaying(false)
    const handlePause = () => setPlaying(false)
    const handlePlay = () => setPlaying(true)

    element.addEventListener('ended', handleEnded)
    element.addEventListener('pause', handlePause)
    element.addEventListener('play', handlePlay)

    return () => {
      element.removeEventListener('ended', handleEnded)
      element.removeEventListener('pause', handlePause)
      element.removeEventListener('play', handlePlay)
    }
  }, [resolved.src])

  useEffect(() => {
    if (!autoPlay || !hasInteracted) return
    void play()
  }, [autoPlay, hasInteracted, play])

  const metadata = formatAudioMetadata(resolved.speaker, resolved.accent)
  const modeLabel = getAudioModeLabel(resolved.mode, resolved.hasCuratedAudio)

  return (
    <div className={cn('space-y-3', className)}>
      {resolved.src && (
        <audio ref={audioRef} src={resolved.src} preload="metadata" className="hidden" />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-(--border-primary) bg-(--bg-card) px-2.5 py-1 text-xs font-semibold text-(--text-secondary)">
          {modeLabel}
        </span>
        {metadata && (
          <span className="text-xs text-(--text-muted)">{metadata}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => { void play() }}
          aria-label={playing ? 'Replay audio' : 'Play audio'}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-(--border-primary) bg-(--bg-card) px-4 py-2.5 text-sm font-display font-bold text-(--text-primary) transition-colors hover:border-(--accent)/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        >
          <Volume2 className="h-4 w-4" />
          {playing ? 'Playing...' : 'Play'}
        </button>

        <button
          type="button"
          onClick={replay}
          className="inline-flex items-center gap-2 text-sm font-display font-bold text-(--accent) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        >
          <RotateCcw className="h-4 w-4" />
          Listen again
        </button>

        <div className="ml-auto flex items-center gap-1" role="group" aria-label="Playback speed">
          {PLAYBACK_RATES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => applyRate(value)}
              aria-pressed={rate === value}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                rate === value
                  ? 'bg-(--accent) text-white'
                  : 'bg-(--bg-tertiary) text-(--text-muted) hover:text-(--text-primary)',
              )}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
