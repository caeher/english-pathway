import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.fn((path: string) => {
  throw { type: 'redirect', path }
})

vi.mock('next/navigation', () => ({
  redirect,
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: null })),
  currentUser: vi.fn(async () => null),
}))

describe('oauth actions', () => {
  beforeEach(() => {
    redirect.mockClear()
  })

  it('redirects signInWithOAuthAction to /sign-in', async () => {
    const { signInWithOAuthAction } = await import('@/lib/auth/actions')

    await expect(signInWithOAuthAction('google')).rejects.toMatchObject({
      type: 'redirect',
      path: '/sign-in',
    })
  })

  it('redirects signUpWithOAuthAction to /sign-up', async () => {
    const { signUpWithOAuthAction } = await import('@/lib/auth/actions')

    await expect(signUpWithOAuthAction('google', null, true)).rejects.toMatchObject({
      type: 'redirect',
      path: '/sign-up',
    })
  })
})
