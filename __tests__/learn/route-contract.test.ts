import { describe, expect, it } from 'vitest'
import { LEARN_PATH } from '@/features/learn'

describe('learn route contract', () => {
  it('exposes a canonical Learn path without curriculum query params', () => {
    expect(LEARN_PATH).toBe('/learn')
  })
})
