export type CardGrade = 'recalled' | 'unsure' | 'missed'

export interface FlashcardRecallResult {
  score: number
  total: number
  scorePercent: number
  weakItemIndexes: number[]
  metrics: { recalled: number; unsure: number; missed: number }
}

export function buildFlashcardRecallResult(
  cardIds: string[],
  cardGrades: Record<string, CardGrade>,
): FlashcardRecallResult {
  let recalled = 0
  let unsure = 0
  let missed = 0
  const weakItemIndexes: number[] = []

  cardIds.forEach((id, index) => {
    const grade = cardGrades[id]
    if (grade === 'recalled') recalled++
    else if (grade === 'unsure') {
      unsure++
      weakItemIndexes.push(index)
    } else if (grade === 'missed') {
      missed++
      weakItemIndexes.push(index)
    }
  })

  const total = cardIds.length
  const scorePercent = total > 0 ? Math.round((recalled / total) * 100) : 0

  return {
    score: recalled,
    total,
    scorePercent,
    weakItemIndexes,
    metrics: { recalled, unsure, missed },
  }
}

export function getExplanationForAnswer(
  explanation: string | undefined,
  correctText: string,
): string {
  return explanation ?? `The correct answer is "${correctText}".`
}
