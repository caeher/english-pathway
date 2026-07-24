import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('ActivityHintTray', () => {
  const source = readFileSync(resolve(process.cwd(), 'components/learn/ActivityHintTray.tsx'), 'utf8')

  it('exposes an accessible live region and more help control', () => {
    expect(source).toContain('aria-live="polite"')
    expect(source).toContain('More help')
    expect(source).toContain('getHintLabel')
  })
})

describe('ActivityRenderer hint wiring', () => {
  const source = readFileSync(resolve(process.cwd(), 'components/learn/ActivityRenderer.tsx'), 'utf8')

  it('renders the hint tray and confirms before revealing answers', () => {
    expect(source).toContain('ActivityHintTray')
    expect(source).toContain('resolveEditorialHint')
    expect(source).toContain('Showing the full answer reduces the practice benefit')
  })
})
