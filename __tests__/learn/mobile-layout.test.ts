import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('mobile learning layout', () => {
  const layout = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionLayout.tsx'), 'utf8')
  const panel = readFileSync(resolve(process.cwd(), 'components/learn/DynamicContentPanel.tsx'), 'utf8')
  const header = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionHeader.tsx'), 'utf8')
  const engagement = readFileSync(resolve(process.cwd(), 'components/engagement/EngagementSummary.tsx'), 'utf8')

  it('uses dynamic viewport and safe-area-aware stacked regions before desktop grid', () => {
    expect(layout).toContain('100dvh')
    expect(layout).toContain('45dvh')
    expect(layout).toContain('env(safe-area-inset-bottom)')
    expect(layout).toContain('lg:grid-cols-2')
    expect(layout).toContain('pb-16')
  })

  it('mounts session header and collapsible engagement metrics above the learn grid', () => {
    expect(layout).toContain('LearnSessionHeader')
    expect(layout).toContain('EngagementSummary')
    expect(layout).toContain('resolveSessionUiState')
    expect(header).toContain('sticky top-16')
    expect(engagement).toContain('Accordion')
    expect(engagement).toContain('defaultExpanded')
  })

  it('keeps activity content mounted and moves focus to changed panel content', () => {
    expect(panel).toContain('headingRef.current?.focus')
    expect(panel).toContain('preventScroll')
    expect(panel).toContain('safe-area-inset-bottom')
  })
})
