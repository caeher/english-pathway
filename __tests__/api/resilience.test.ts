import { describe, expect, it } from 'vitest'
import { withApiTimeout } from '@/lib/api/timeout'
import { getRateLimitPolicy } from '@/lib/security/rate-limit'

describe('API resilience policy', () => {
  it('limits every critical mutation route', () => {
    for (const route of ['/api/progress/activity', '/api/progress/chapter', '/api/progress/merge', '/api/engagement/session', '/api/srs', '/api/tutor/memory']) {
      expect(getRateLimitPolicy(route), route).not.toBeNull()
    }
  })

  it('returns a typed timeout before a dependency can hold the response open', async () => {
    await expect(withApiTimeout(new Promise<void>(() => {}), 1)).rejects.toMatchObject({ code: 'TIMEOUT', status: 504 })
  })
})
