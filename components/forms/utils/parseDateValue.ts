import { CalendarDate } from '@internationalized/date'

export function parseDateValue(value: unknown): CalendarDate | null {
  if (!value) return null

  if (value && typeof value === 'object' && 'calendar' in value && 'year' in value && 'month' in value && 'day' in value) {
    return value as CalendarDate
  }

  if (value instanceof Date) {
    return new CalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate())
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
    }
  }

  if (typeof value === 'string') {
    const cleaned = value.trim()
    if (!cleaned) return null

    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10)
      const month = parseInt(isoMatch[2], 10)
      const day = parseInt(isoMatch[3], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new CalendarDate(year, month, day)
      }
    }

    const dateObj = new Date(cleaned)
    if (!isNaN(dateObj.getTime())) {
      return new CalendarDate(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate())
    }
  }

  return null
}
