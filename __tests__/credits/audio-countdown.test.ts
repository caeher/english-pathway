import { describe, expect, it } from 'vitest'
import {
  calculateConsumedAudioSeconds,
  calculateRemainingAudioSeconds,
  formatDuration,
  formatVoiceRemainingLabel,
} from '@/lib/credits/audio-countdown'

describe('audio countdown and duration formatting', () => {
  describe('formatDuration', () => {
    it('formats seconds into M:SS and MM:SS without provider prefix', () => {
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(5)).toBe('0:05')
      expect(formatDuration(59)).toBe('0:59')
      expect(formatDuration(65)).toBe('1:05')
      expect(formatDuration(600)).toBe('10:00')
      expect(formatDuration(1182)).toBe('19:42')
      expect(formatDuration(1200)).toBe('20:00')
    })

    it('safely clamps negative values and rounds down decimals', () => {
      expect(formatDuration(-10)).toBe('0:00')
      expect(formatDuration(119.8)).toBe('1:59')
    })
  })

  describe('calculateRemainingAudioSeconds', () => {
    it('calculates remaining audio seconds from wall-clock timestamps', () => {
      const startedAt = 1_000_000
      const maxSeconds = 1200

      // 0 seconds elapsed
      expect(calculateRemainingAudioSeconds(startedAt, maxSeconds, 1_000_000)).toBe(1200)

      // 18 seconds elapsed (e.g. 19:42 remaining)
      expect(calculateRemainingAudioSeconds(startedAt, maxSeconds, 1_018_000)).toBe(1182)

      // 600 seconds elapsed (10:00 remaining)
      expect(calculateRemainingAudioSeconds(startedAt, maxSeconds, 1_600_000)).toBe(600)
    })

    it('does not drift after backgrounding or interval throttling', () => {
      const startedAt = 1_000_000
      const maxSeconds = 1200

      // Simulated backgrounding where browser suspended timers for 75 seconds
      const afterBackgroundingNow = startedAt + 75_400
      const remaining = calculateRemainingAudioSeconds(startedAt, maxSeconds, afterBackgroundingNow)

      expect(remaining).toBe(1125) // 1200 - 75 = 1125 seconds (18:45)
    })

    it('clamps remaining seconds to zero once allowance is exhausted', () => {
      const startedAt = 1_000_000
      const maxSeconds = 1200

      expect(calculateRemainingAudioSeconds(startedAt, maxSeconds, 1_000_000 + 1300 * 1000)).toBe(0)
    })

    it('returns zero for invalid startedAt or maxSeconds', () => {
      expect(calculateRemainingAudioSeconds(0, 1200)).toBe(0)
      expect(calculateRemainingAudioSeconds(1_000_000, 0)).toBe(0)
    })
  })

  describe('calculateConsumedAudioSeconds', () => {
    it('calculates consumed seconds rounding up to nearest integer and clamped by maxSeconds', () => {
      const startedAt = 1_000_000
      const maxSeconds = 1200

      // 10.2 seconds elapsed -> ceil to 11
      expect(calculateConsumedAudioSeconds(startedAt, maxSeconds, 1_010_200)).toBe(11)

      // 25.0 seconds elapsed -> 25
      expect(calculateConsumedAudioSeconds(startedAt, maxSeconds, 1_025_000)).toBe(25)

      // Past max seconds -> clamped to 1200
      expect(calculateConsumedAudioSeconds(startedAt, maxSeconds, 1_000_000 + 1500 * 1000)).toBe(1200)
    })

    it('returns zero for invalid startedAt or maxSeconds', () => {
      expect(calculateConsumedAudioSeconds(0, 1200)).toBe(0)
      expect(calculateConsumedAudioSeconds(1_000_000, 0)).toBe(0)
    })
  })

  describe('formatVoiceRemainingLabel', () => {
    it('returns clean "{MM:SS} voice remaining" without provider branding during active lesson', () => {
      const label = formatVoiceRemainingLabel({
        active: true,
        liveRemainingSeconds: 1182,
        credits: { audioSecondsRemaining: 1200 },
      })

      expect(label).toBe('19:42 voice remaining')
      expect(label).not.toContain('OpenAI')
      expect(label).not.toContain('realtime')
    })

    it('returns server credit balance when inactive', () => {
      const label = formatVoiceRemainingLabel({
        active: false,
        liveRemainingSeconds: null,
        credits: { audioSecondsRemaining: 1200 },
      })

      expect(label).toBe('20:00 voice remaining')
      expect(label).not.toContain('OpenAI')
    })

    it('returns "0:00 voice remaining" when allowance is completely exhausted', () => {
      const label = formatVoiceRemainingLabel({
        active: false,
        liveRemainingSeconds: null,
        credits: { audioSecondsRemaining: 0 },
      })

      expect(label).toBe('0:00 voice remaining')
    })

    it('returns loading label while credits request is in flight', () => {
      const label = formatVoiceRemainingLabel({
        active: false,
        liveRemainingSeconds: null,
        credits: null,
      })

      expect(label).toBe('Voice credits loading…')
    })

    it('returns explicit unavailable error state when credit request fails', () => {
      const label = formatVoiceRemainingLabel({
        active: false,
        liveRemainingSeconds: null,
        credits: null,
        creditsError: true,
      })

      expect(label).toBe('Voice credits unavailable')
    })
  })
})
