export function parseTimeValue(value: unknown): { hours: number; minutes: number; seconds: number } | null {
  if (!value) return null

  if (value && typeof value === 'object' && 'hours' in value && 'minutes' in value) {
    const obj = value as { hours: number; minutes: number; seconds?: number }
    return {
      hours: Number(obj.hours),
      minutes: Number(obj.minutes),
      seconds: Number(obj.seconds || 0),
    }
  }

  if (typeof value === 'string') {
    const cleaned = value.trim()
    if (!cleaned) return null

    const dateTimeMatch = cleaned.match(/[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
    if (dateTimeMatch) {
      return {
        hours: parseInt(dateTimeMatch[1], 10),
        minutes: parseInt(dateTimeMatch[2], 10),
        seconds: dateTimeMatch[3] ? parseInt(dateTimeMatch[3], 10) : 0,
      }
    }

    const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|AM|PM)?$/)
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10)
      const minutes = parseInt(ampmMatch[2], 10)
      const seconds = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0
      const period = ampmMatch[4]?.toLowerCase()

      if (period === 'pm' && hours < 12) {
        hours += 12
      } else if (period === 'am' && hours === 12) {
        hours = 0
      }

      return { hours, minutes, seconds }
    }
  }

  if (value instanceof Date) {
    return {
      hours: value.getHours(),
      minutes: value.getMinutes(),
      seconds: value.getSeconds(),
    }
  }

  return null
}
