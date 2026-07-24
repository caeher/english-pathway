import { describe, expect, it } from 'vitest'
import {
  buildDiscriminationFeedback,
  getPlayedWord,
  isDiscriminationCorrect,
} from '@/features/activities/minimal-pairs'
import type { MinimalPairItem } from '@/types'

const samplePair: MinimalPairItem = {
  id: 'mp1',
  label: 'Vowel length',
  wordA: 'ship',
  wordB: 'sheep',
  phoneme: '/ɪ/ vs /iː/',
  tip: 'Keep ship short; stretch sheep longer.',
  meaningA: 'boat',
  meaningB: 'animal',
}

describe('minimal-pairs helpers', () => {
  it('resolves the played word from the variant', () => {
    expect(getPlayedWord(samplePair, 'A')).toBe('ship')
    expect(getPlayedWord(samplePair, 'B')).toBe('sheep')
  })

  it('scores discrimination only from the played variant', () => {
    expect(isDiscriminationCorrect('A', 'A')).toBe(true)
    expect(isDiscriminationCorrect('B', 'A')).toBe(false)
  })

  it('builds feedback that names the heard word and articulatory tip', () => {
    expect(buildDiscriminationFeedback(samplePair, 'A', true)).toContain('ship')
    expect(buildDiscriminationFeedback(samplePair, 'A', false)).toContain('sheep')
    expect(buildDiscriminationFeedback(samplePair, 'A', true)).toContain(samplePair.tip)
  })
})
