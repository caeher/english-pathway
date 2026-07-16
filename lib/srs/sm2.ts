export interface SrsItem {
  easeFactor: number
  intervalDays: number
  repetitions: number
}

export type SrsQuality = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Simplified SM-2 algorithm.
 * quality: 0-2 = fail, 3-5 = pass (higher = easier recall)
 */
export function sm2Update(item: SrsItem, quality: SrsQuality): SrsItem {
  let { easeFactor, intervalDays, repetitions } = item

  if (quality < 3) {
    return {
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      intervalDays: 1,
      repetitions: 0,
    }
  }

  repetitions += 1

  if (repetitions === 1) {
    intervalDays = 1
  } else if (repetitions === 2) {
    intervalDays = 3
  } else {
    intervalDays = Math.round(intervalDays * easeFactor)
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = Math.max(1.3, easeFactor)

  return { easeFactor, intervalDays, repetitions }
}

export function nextReviewDate(intervalDays: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + intervalDays)
  return d
}
