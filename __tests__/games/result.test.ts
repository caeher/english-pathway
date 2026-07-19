import { describe, expect, it } from 'vitest'
import { normalizeActivityResult } from '@/lib/games/result'

describe('normalized activity results', () => {
  it('distinguishes complete, partial, and practice-needed outcomes', () => {
    expect(normalizeActivityResult({ score: 2, total: 2 }).correctness).toBe('complete')
    expect(normalizeActivityResult({ score: 3, total: 4 }).nextAction).toBe('review')
    expect(normalizeActivityResult({ score: 1, total: 4 }).nextAction).toBe('retry')
  })

  it('preserves optional feedback and metrics for persistence', () => {
    expect(normalizeActivityResult({ score: 1, total: 2, explanations: ['Explain'], weakItemIndexes: [1], metrics: { attempts: 3 } })).toMatchObject({ explanations: ['Explain'], weakItemIndexes: [1], metrics: { attempts: 3 } })
  })
})
