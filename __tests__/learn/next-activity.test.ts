import { describe, expect, it } from 'vitest'
import { pickNextActivityId } from '@/lib/learn/next-activity'

const activities = [
  { id: 'a-1' },
  { id: 'a-2' },
  { id: 'a-3' },
]

describe('pickNextActivityId', () => {
  it('returns the next uncompleted activity in chapter order', () => {
    const next = pickNextActivityId(activities, 'a-1', (id) => id === 'a-1')
    expect(next).toBe('a-2')
  })

  it('returns null when every activity is completed', () => {
    const next = pickNextActivityId(activities, 'a-3', () => true)
    expect(next).toBeNull()
  })

  it('wraps to earlier uncompleted activities when later ones are done', () => {
    const completed = new Set(['a-2', 'a-3'])
    const next = pickNextActivityId(activities, 'a-3', (id) => completed.has(id))
    expect(next).toBe('a-1')
  })
})
