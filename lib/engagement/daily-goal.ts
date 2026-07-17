export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export function getLocalDateString(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function computeGoalProgress(minutesStudied: number, dailyGoalMinutes: number) {
  const pct = dailyGoalMinutes > 0 ? Math.min(100, Math.round((minutesStudied / dailyGoalMinutes) * 100)) : 0
  const goalMet = minutesStudied >= dailyGoalMinutes
  const minutesRemaining = Math.max(0, dailyGoalMinutes - minutesStudied)
  return { pct, goalMet, minutesRemaining }
}

export function formatStudyMinutes(minutes: number): string {
  if (minutes < 1) return '< 1 min'
  if (minutes === 1) return '1 min'
  return `${minutes} min`
}
