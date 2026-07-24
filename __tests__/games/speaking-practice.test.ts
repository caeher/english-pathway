import { describe, expect, it } from 'vitest'
import { scorePronunciation } from '@/lib/audio/pronunciation-scoring'

const ACCEPTANCE_THRESHOLD = 70

function evaluateOralAttempt(text: string, phrase: string) {
  const result = scorePronunciation(text, phrase)
  return {
    percent: result.percent,
    passedOral: result.percent >= ACCEPTANCE_THRESHOLD,
  }
}

function evaluateTextAttempt(text: string, phrase: string) {
  const result = scorePronunciation(text, phrase)
  return {
    percent: result.percent,
    passedOral: false,
    countsTowardOralCompetence: false,
  }
}

describe('speaking practice honesty rules', () => {
  it('counts oral attempts toward pass threshold', () => {
    const oral = evaluateOralAttempt('ship', 'ship')
    expect(oral.passedOral).toBe(true)
  })

  it('does not count text fallback as oral competence even with a perfect match', () => {
    const text = evaluateTextAttempt('ship', 'ship')
    expect(text.percent).toBe(100)
    expect(text.passedOral).toBe(false)
    expect(text.countsTowardOralCompetence).toBe(false)
  })

  it('marks oral attempts below threshold as not passed', () => {
    const oral = evaluateOralAttempt('shop', 'ship')
    expect(oral.passedOral).toBe(false)
  })
})
