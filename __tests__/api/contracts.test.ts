import { describe, expect, it } from 'vitest'
import { apiErrorResponse, DomainError } from '@/lib/api/errors'
import { apiErrorSchema } from '@/lib/api/contracts'
import { activityProgressResponseSchema } from '@/features/progress/contracts'
import { assessmentResultSchema } from '@/features/onboarding'

describe('API contracts', () => {
  it('maps domain errors to the shared error response shape', async () => {
    const response = apiErrorResponse(new DomainError('NOT_FOUND', 'Resource not found'), 'Fallback')
    expect(response.status).toBe(404)
    expect(apiErrorSchema.parse(await response.json())).toEqual({
      error: 'Resource not found',
      code: 'NOT_FOUND',
    })
  })

  it('validates feature response contracts', () => {
    expect(activityProgressResponseSchema.parse({ ok: true, progress: { status: 'completed' } }).ok).toBe(true)
    expect(assessmentResultSchema.safeParse({ level: 'beginner', score: 1, rubricVersion: 'v1', explanation: ['Clear feedback'] }).success).toBe(true)
  })
})
