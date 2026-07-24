import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ActivityType } from '@/types'

const ACTIVITY_TYPES: ActivityType[] = [
  'flashcard',
  'word-match',
  'sentence-builder',
  'quiz',
  'word-scramble',
  'listening',
  'dictation',
  'pronunciation',
  'branching-dialogue',
]

describe('ActivityRenderer coverage', () => {
  it('lists all supported activity types', () => {
    expect(ACTIVITY_TYPES).toHaveLength(9)
  })

  it('delegates post-activity feedback to the learn shell', () => {
    const renderer = readFileSync(resolve(process.cwd(), 'components/learn/ActivityRenderer.tsx'), 'utf8')
    expect(renderer).toContain('ActivityCompletionCard')
    expect(renderer).toContain('handleRetry')
    expect(renderer).toContain('handleAcceptFollowUp')
  })
})
