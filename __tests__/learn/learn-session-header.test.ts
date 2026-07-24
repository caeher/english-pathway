import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('LearnSessionHeader', () => {
  it('exposes sticky session chrome with state badge and live next-action region', () => {
    const header = readFileSync(resolve(root, 'components/learn/LearnSessionHeader.tsx'), 'utf8')

    expect(header).toContain('LearnSessionHeader')
    expect(header).toContain('sticky top-16')
    expect(header).toContain('aria-label="Current learning session"')
    expect(header).toContain('stateBadgeLabel')
    expect(header).toContain('objectiveLabel')
    expect(header).toContain('nextActionLabel')
    expect(header).toContain('aria-live="polite"')
    expect(header).toContain('--learn-session-header-height')
  })

  it('renders continuation CTA only during pre_session', () => {
    const header = readFileSync(resolve(root, 'components/learn/LearnSessionHeader.tsx'), 'utf8')

    expect(header).toContain("snapshot.state === 'pre_session'")
    expect(header).toContain('continuationHref')
    expect(header).toContain('continuationLabel')
  })
})

describe('LearnSessionHeader state badges', () => {
  it('covers all five session visual states', () => {
    const header = readFileSync(resolve(root, 'components/learn/LearnSessionHeader.tsx'), 'utf8')

    expect(header).toContain('pre_session')
    expect(header).toContain('connecting')
    expect(header).toContain('active_practice')
    expect(header).toContain('feedback')
    expect(header).toContain('completed')
  })
})
