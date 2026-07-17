import { describe, expect, it } from 'vitest'
import { normalizePronunciationText, scorePronunciation } from '@/lib/audio/pronunciation-scoring'

describe('pronunciation scoring', () => {
  it('normalizes punctuation and common contractions', () => {
    expect(normalizePronunciationText("I'm ready, aren't I?")).toEqual(['i', 'am', 'ready', 'are', 'not', 'i'])
  })

  it('awards a perfect score for equivalent normalized phrases', () => {
    const result = scorePronunciation("I'm ready.", 'I am ready')

    expect(result.percent).toBe(100)
    expect(result.words.every((word) => word.status === 'correct')).toBe(true)
  })

  it('reports incorrect, missing, and extra words', () => {
    const result = scorePronunciation('I read books today', 'I like books')

    expect(result.percent).toBe(50)
    expect(result.words).toEqual([
      { target: 'i', spoken: 'i', status: 'correct' },
      { target: 'like', spoken: 'read', status: 'incorrect' },
      { target: 'books', spoken: 'books', status: 'correct' },
    ])
    expect(result.extraWords).toEqual(['today'])
  })

  it('returns zero for an empty attempt', () => {
    const result = scorePronunciation('', 'Speak clearly')

    expect(result.percent).toBe(0)
    expect(result.words).toEqual([
      { target: 'speak', status: 'missing' },
      { target: 'clearly', status: 'missing' },
    ])
  })

  it('tolerates punctuation and minor word differences in the score', () => {
    const result = scorePronunciation('Please open the door', 'Please open door')

    expect(result.percent).toBe(75)
    expect(result.extraWords).toEqual(['the'])
  })
})
