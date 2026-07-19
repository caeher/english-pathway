import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('mobile learning layout', () => {
  const layout = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionLayout.tsx'), 'utf8')
  const panel = readFileSync(resolve(process.cwd(), 'components/learn/DynamicContentPanel.tsx'), 'utf8')

  it('uses dynamic viewport and safe-area-aware stacked regions before desktop grid', () => {
    expect(layout).toContain('100dvh')
    expect(layout).toContain('max-h-[58dvh]')
    expect(layout).toContain('env(safe-area-inset-bottom)')
    expect(layout).toContain('lg:grid-cols-2')
  })

  it('keeps activity content mounted and moves focus to changed panel content', () => {
    expect(panel).toContain('headingRef.current?.focus')
    expect(panel).toContain('preventScroll')
    expect(panel).toContain('safe-area-inset-bottom')
  })
})
