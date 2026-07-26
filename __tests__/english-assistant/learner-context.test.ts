import { describe, expect, it, vi } from 'vitest'
import { resolveEnglishAssistantLearnerContext } from '@/lib/english-assistant/learner-context'

function createSupabaseMock(level: string | null, error: Error | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: level === null && !error ? null : { level },
    error,
  })

  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return {
    client: { from } as never,
    from,
    select,
    eq,
    maybeSingle,
  }
}

describe('resolveEnglishAssistantLearnerContext', () => {
  it.each(['beginner', 'intermediate', 'advanced'] as const)(
    'returns a validated level for %s',
    async (level) => {
      const { client, from, select, eq } = createSupabaseMock(level)

      const result = await resolveEnglishAssistantLearnerContext(client, 'user-1')

      expect(result).toEqual({ level })
      expect(from).toHaveBeenCalledWith('profiles')
      expect(select).toHaveBeenCalledWith('level')
      expect(eq).toHaveBeenCalledWith('id', 'user-1')
    },
  )

  it('returns null level for missing profiles', async () => {
    const { client } = createSupabaseMock(null)
    await expect(resolveEnglishAssistantLearnerContext(client, 'user-1')).resolves.toEqual({ level: null })
  })

  it('returns null level for invalid stored values', async () => {
    const { client } = createSupabaseMock('expert')
    await expect(resolveEnglishAssistantLearnerContext(client, 'user-1')).resolves.toEqual({ level: null })
  })

  it('returns null level when the profile query fails', async () => {
    const { client } = createSupabaseMock(null, new Error('query failed'))
    await expect(resolveEnglishAssistantLearnerContext(client, 'user-1')).resolves.toEqual({ level: null })
  })
})
