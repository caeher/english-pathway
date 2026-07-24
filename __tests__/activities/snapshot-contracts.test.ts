import { describe, expect, it } from 'vitest'
import { activityRegistry } from '@/features/activities/registry'
import {
  dictationSnapshot,
  flashcardSnapshot,
  listeningSnapshot,
  pronunciationSnapshot,
  quizSnapshot,
  sentenceBuilderSnapshot,
  wordMatchSnapshot,
  wordScrambleSnapshot,
} from '@/features/activities/snapshots'

describe('activity snapshot contracts', () => {
  it('registers a snapshot contract for every activity type', () => {
    expect(quizSnapshot.summarize(quizSnapshot.schema.parse({
      current: 1, selected: 0, fillValue: '', answered: false, score: 0, weakItemIndexes: [],
    }))).toContain('Question')
    expect(activityRegistry.quiz.snapshot).toBe(quizSnapshot)
    expect(activityRegistry.flashcard.snapshot).toBe(flashcardSnapshot)
    expect(activityRegistry['word-match'].snapshot).toBe(wordMatchSnapshot)
    expect(activityRegistry['sentence-builder'].snapshot).toBe(sentenceBuilderSnapshot)
    expect(activityRegistry['word-scramble'].snapshot).toBe(wordScrambleSnapshot)
    expect(activityRegistry.listening.snapshot).toBe(listeningSnapshot)
    expect(activityRegistry.dictation.snapshot).toBe(dictationSnapshot)
    expect(activityRegistry.pronunciation.snapshot).toBe(pronunciationSnapshot)
  })

  it('summarizes representative payloads for each contract', () => {
    expect(flashcardSnapshot.summarize({ current: 0, revealed: false, answered: false, cardGrades: { a: 'recalled' }, weakItemIndexes: [] })).toContain('Card')
    expect(wordMatchSnapshot.summarize({ matchedLeftIndices: [0], attempts: 2 })).toContain('pairs matched')
    expect(sentenceBuilderSnapshot.summarize({ current: 0, placed: [1, 0], checked: false, score: 0 })).toContain('Sentence')
    expect(wordScrambleSnapshot.summarize({ current: 0, selected: ['H'], placedIndices: [0], score: 0 })).toContain('Word')
    expect(listeningSnapshot.summarize({ current: 0, selected: 1, answered: true, score: 1, weakItemIndexes: [] })).toContain('Audio')
    expect(dictationSnapshot.summarize({ current: 0, value: 'hello', answered: false, score: 0, weakItemIndexes: [] })).toContain('Dictation')
    expect(pronunciationSnapshot.summarize({ current: 1, bestScores: [80, 0] })).toContain('Speaking phrase')
  })

  it('rejects pronunciation payloads that include transcripts', () => {
    const parsed = pronunciationSnapshot.schema.safeParse({
      current: 0,
      bestScores: [50],
      transcript: 'should not be stored',
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && 'transcript' in parsed.data).toBe(false)
  })
})
