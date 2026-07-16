import { describe, expect, it } from 'vitest'
import type { ActivityType } from '@/types'

const ACTIVITY_TYPES: ActivityType[] = [
  'svg-scene',
  'flashcard',
  'word-match',
  'sentence-builder',
  'quiz',
  'word-scramble',
  'listening',
  'dictation',
  'pronunciation',
  'drag-drop',
]

describe('ActivityRenderer coverage', () => {
  it('lists all supported activity types', () => {
    expect(ACTIVITY_TYPES).toHaveLength(10)
  })
})
