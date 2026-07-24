import { describe, expect, it } from 'vitest'
import {
  buildTutorHintRequest,
  resolveEditorialHint,
} from '@/features/activities/hints'

describe('resolveEditorialHint', () => {
  const wordScrambleProps = {
    words: [{ word: 'hello', hint: 'A greeting', category: 'Greetings' }],
  }

  const dictationProps = {
    items: [{ id: 'd1', audioText: 'My name is Ana.', hint: 'Introduction phrase' }],
  }

  const pronunciationProps = {
    items: [{ id: 'p1', phrase: 'Nice to meet you', hint: 'Standard greeting' }],
  }

  it('returns reminder hints at level 1 without revealing answers', () => {
    const hint = resolveEditorialHint('word-scramble', wordScrambleProps, 0, 1)
    expect(hint).toMatchObject({ level: 1, revealsAnswer: false, source: 'editorial' })
    expect(hint?.body).toContain('greeting')
    expect(hint?.body.toLowerCase()).not.toContain('hello')
  })

  it('returns partial hints at level 2 without full answers', () => {
    const scramble = resolveEditorialHint('word-scramble', wordScrambleProps, 0, 2)
    expect(scramble?.revealsAnswer).toBe(false)
    expect(scramble?.body).toContain('H')
    expect(scramble?.body).not.toContain('hello')

    const dictation = resolveEditorialHint('dictation', dictationProps, 0, 2)
    expect(dictation?.revealsAnswer).toBe(false)
    expect(dictation?.body).toContain('My name')
    expect(dictation?.body).not.toContain('My name is Ana.')

    const pronunciation = resolveEditorialHint('pronunciation', pronunciationProps, 0, 2)
    expect(pronunciation?.revealsAnswer).toBe(false)
    expect(pronunciation?.body).not.toContain('Nice to meet you')
  })

  it('marks level 3 hints as revealing the answer', () => {
    const hint = resolveEditorialHint('dictation', dictationProps, 0, 3)
    expect(hint?.revealsAnswer).toBe(true)
    expect(hint?.body).toContain('My name is Ana.')
  })

  it('returns null for out-of-range items', () => {
    expect(resolveEditorialHint('word-scramble', wordScrambleProps, 5, 1)).toBeNull()
  })

  it('returns null for unsupported activity types', () => {
    expect(resolveEditorialHint('quiz', { questions: [] }, 0, 1)).toBeNull()
  })
})

describe('buildTutorHintRequest', () => {
  it('includes structured activity context without answers', () => {
    const message = buildTutorHintRequest({
      activityId: 'm1-ch1-dictation',
      activityType: 'dictation',
      activityTitle: 'Dictation practice',
      itemIndex: 1,
      level: 2,
      maxLevel: 3,
    })

    expect(message).toContain('m1-ch1-dictation')
    expect(message).toContain('dictation')
    expect(message).toContain('item 2')
    expect(message).toContain('level 2')
    expect(message).not.toMatch(/My name is Ana/i)
  })
})
