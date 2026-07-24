import { describe, expect, it } from 'vitest'
import { resolveAudioPracticeMode } from '@/features/activities/audio-schema'
import {
  formatAudioMetadata,
  getAudioModeLabel,
  resolveActivityAudioSource,
} from '@/lib/audio/curated-audio'

describe('curated audio helpers', () => {
  it('defaults guided mode when only TTS fallback is available', () => {
    expect(resolveAudioPracticeMode(undefined, false)).toBe('guided')
    expect(resolveActivityAudioSource({ fallbackText: 'hello' }).mode).toBe('guided')
  })

  it('defaults evaluation mode when curated audio exists', () => {
    expect(resolveAudioPracticeMode(undefined, true)).toBe('evaluation')
  })

  it('labels browser TTS honestly', () => {
    expect(getAudioModeLabel('guided', false)).toBe('Browser voice (practice only)')
    expect(getAudioModeLabel('evaluation', true)).toBe('Recorded audio')
  })

  it('formats speaker and accent metadata', () => {
    expect(formatAudioMetadata('Alex', 'US English')).toBe('Alex · US English')
    expect(formatAudioMetadata(undefined, undefined)).toBeNull()
  })
})
