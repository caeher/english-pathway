import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('LearnSessionHeader', () => {
  it('exposes sticky session chrome with a single back control', () => {
    const header = readFileSync(resolve(root, 'components/learn/LearnSessionHeader.tsx'), 'utf8')

    expect(header).toContain('LearnSessionHeader')
    expect(header).toContain('sticky top-0')
    expect(header).toContain('aria-label="Current learning session"')
    expect(header).toContain('--learn-session-header-height')
    expect(header).not.toContain('stateBadgeLabel')
    expect(header).not.toContain('continuationHref')
    expect(header).not.toContain('planSheet')
  })

  it('renders an accessible back link to the dashboard', () => {
    const header = readFileSync(resolve(root, 'components/learn/LearnSessionHeader.tsx'), 'utf8')

    expect(header).toContain('aria-label="Back to dashboard"')
    expect(header).toContain('ArrowLeft')
    expect(header).toContain("exitHref = '/dashboard'")
    expect(header).not.toContain('Back to home')
  })

  it('exposes an accessible help dialog trigger without reintroducing plan sheet chrome', () => {
    const header = readFileSync(resolve(root, 'components/learn/LearnSessionHeader.tsx'), 'utf8')

    expect(header).toContain('LearnHelpDialog')
    expect(header).toContain('justify-between')
    expect(header).not.toContain('planSheet')
  })
})
