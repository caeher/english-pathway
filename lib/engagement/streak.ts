const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function getPreviousDateString(dateString: string): string | null {
  if (!isDateOnly(dateString)) return null
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

/**
 * A persisted streak remains current only when the learner studied today or
 * yesterday in their own timezone. The database retains the historic value so
 * the next valid session can either extend it or restart it deterministically.
 */
export function getActiveStreak(currentStreak: number, lastStudyDate: string | null, localDate: string): number {
  const safeStreak = Number.isFinite(currentStreak) ? Math.max(0, Math.floor(currentStreak)) : 0
  const previousDate = getPreviousDateString(localDate)
  if (!lastStudyDate || !previousDate) return 0
  return lastStudyDate === localDate || lastStudyDate === previousDate ? safeStreak : 0
}
