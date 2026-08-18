import { describe, expect, it, vi } from 'vitest'
import { evaluateAssessment, ASSESSMENT_QUESTIONS, ASSESSMENT_VERSION } from '@/lib/onboarding/assessment'
import { POST } from '@/app/api/onboarding/assessment/route'

const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: vi.fn(async () => null),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}))

describe('level assessment', () => {
  it('uses a versioned rubric and returns an explainable recommendation', () => {
    const result = evaluateAssessment(ASSESSMENT_QUESTIONS.map(({ id }) => ({
      questionId: id,
      response: 'I am learning English and I practice every day.',
    })))

    expect(result.rubricVersion).toBe(ASSESSMENT_VERSION)
    expect(['beginner', 'intermediate', 'advanced']).toContain(result.level)
    expect(result.explanation).toHaveLength(3)
  })

  it('rejects unauthenticated assessment requests', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const response = await POST(new Request('http://localhost/api/onboarding/assessment', {
      method: 'POST',
      body: JSON.stringify({ source: 'text', answers: [] }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(401)
  })
})
