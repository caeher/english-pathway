import { describe, expect, it, vi } from 'vitest'
import { getAverageAudioLevel, stopMediaStream } from '@/lib/audio/microphone'

describe('microphone lifecycle helpers', () => {
  it('stops every track when a session ends', () => {
    const first = { stop: vi.fn() }
    const second = { stop: vi.fn() }
    stopMediaStream({ getTracks: () => [first, second] } as unknown as MediaStream)
    expect(first.stop).toHaveBeenCalledOnce()
    expect(second.stop).toHaveBeenCalledOnce()
  })

  it('calculates input level around the neutral waveform midpoint', () => {
    expect(getAverageAudioLevel([128, 128, 128])).toBe(0)
    expect(getAverageAudioLevel([120, 136])).toBe(8)
  })
})
