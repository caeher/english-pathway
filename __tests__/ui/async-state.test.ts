import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('async-state conventions', () => {
  it('provides named accessible primitives for every async outcome', () => {
    const source = readFileSync(resolve(process.cwd(), 'components/ui/async-state.tsx'), 'utf8')
    expect(source).toContain('export function LoadingState')
    expect(source).toContain('export function EmptyState')
    expect(source).toContain('export function InlineError')
    expect(source).toContain('export function SuccessState')
    expect(source).toContain('aria-busy="true"')
    expect(source).toContain('role="alert"')
  })

  it('gives primary async routes loading and retryable error boundaries', () => {
    for (const path of ['app/(account)/loading.tsx', 'app/(learn)/loading.tsx', 'app/(public)/curriculum/loading.tsx', 'app/(account)/error.tsx', 'app/(learn)/error.tsx', 'app/(public)/curriculum/error.tsx']) {
      expect(readFileSync(resolve(process.cwd(), path), 'utf8')).toMatch(/LoadingState|FriendlyError/)
    }
  })
})
