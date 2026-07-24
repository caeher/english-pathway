import type { CuratedAudio } from '@/types'
import { resolveAudioPracticeMode } from '@/features/activities/audio-schema'

export const PLAYBACK_RATES = [0.75, 1, 1.25] as const
export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

export interface ActivityAudioSource {
  fallbackText: string
  curated?: CuratedAudio
  mode?: 'guided' | 'evaluation'
}

export function resolveActivityAudioSource(source: ActivityAudioSource) {
  const hasCuratedAudio = Boolean(source.curated?.src)
  const mode = resolveAudioPracticeMode(source.mode, hasCuratedAudio)
  const transcript = source.curated?.transcript ?? source.fallbackText

  return {
    hasCuratedAudio,
    mode,
    transcript,
    speaker: source.curated?.speaker,
    accent: source.curated?.accent,
    altText: source.curated?.altText,
    src: source.curated?.src,
    defaultRate: source.curated?.defaultRate ?? 1,
    fallbackText: source.fallbackText,
  }
}

export function formatAudioMetadata(speaker?: string, accent?: string): string | null {
  const parts = [speaker, accent].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function getAudioModeLabel(mode: 'guided' | 'evaluation', hasCuratedAudio: boolean): string {
  if (hasCuratedAudio && mode === 'evaluation') return 'Recorded audio'
  return 'Browser voice (practice only)'
}
