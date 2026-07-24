import { describe, expect, it } from 'vitest'
import {
  evaluateActivityEditorialRules,
  evaluateChapterQuality,
  findDuplicateContentAcrossChapter,
  isGenericDescription,
  isGenericTitle,
  scoreFromFindings,
} from '@/features/activities/quality'
import type { ChapterActivityInput } from '@/features/activities/contracts'

const cleanQuiz: ChapterActivityInput = {
  id: 'm1-ch1-quiz',
  type: 'quiz',
  title: 'Alphabet recognition check',
  description: 'Check letter names and example words from this chapter.',
  props: {
    questions: Array.from({ length: 5 }, (_, index) => ({
      id: `q${index + 1}`,
      type: 'multiple-choice' as const,
      question: `Question ${index + 1}`,
      options: ['A', 'B', 'C'],
      correct: 0,
      explanation: 'Because the chapter introduces this letter.',
    })),
  },
}

describe('activity quality rubric', () => {
  it('flags generic titles and descriptions', () => {
    expect(isGenericTitle('Listen and Choose')).toBe(true)
    expect(isGenericDescription('Listen and choose the correct answer.')).toBe(true)

    const findings = evaluateActivityEditorialRules('m1-ch1', {
      ...cleanQuiz,
      title: 'Listen and Choose',
      description: 'Listen and choose the correct answer.',
    })

    expect(findings.some((finding) => finding.field === 'title')).toBe(true)
    expect(findings.some((finding) => finding.field === 'description')).toBe(true)
  })

  it('detects duplicate vocabulary across flashcard and word-match', () => {
    const activities: ChapterActivityInput[] = [
      {
        id: 'm1-ch1-flashcard',
        type: 'flashcard',
        title: 'Vocabulary',
        description: 'Chapter vocabulary cards.',
        props: { cards: [{ id: 'c1', front: 'Apple', back: 'Manzana' }] },
      },
      {
        id: 'm1-ch1-word-match',
        type: 'word-match',
        title: 'Match words',
        description: 'Match chapter terms.',
        props: { pairs: [{ left: 'Apple', right: 'Manzana' }] },
      },
    ]

    const duplicates = findDuplicateContentAcrossChapter(activities)
    expect(duplicates.some((finding) => finding.message.includes('Apple'))).toBe(true)
  })

  it('scores chapters from validation and editorial findings', () => {
    const report = evaluateChapterQuality({
      moduleId: 'modulo-1',
      chapterId: 'm1-ch1',
      activities: [cleanQuiz],
    })

    expect(report.chapterScore.score).toBeGreaterThan(0)
    expect(report.chapterScore.activityScores[0]?.activityId).toBe('m1-ch1-quiz')
  })

  it('reduces score when blocking findings are present', () => {
    const score = scoreFromFindings([
      {
        dimension: 'masteryEvidence',
        severity: 'blocking',
        field: 'type',
        message: 'missing scoring',
      },
    ])

    expect(score).toBeLessThan(100)
  })
})
