import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('mobile learning layout', () => {
  const layout = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionLayout.tsx'), 'utf8')
  const learnRouteLayout = readFileSync(resolve(process.cwd(), 'app/(learn)/layout.tsx'), 'utf8')
  const panel = readFileSync(resolve(process.cwd(), 'components/learn/DynamicContentPanel.tsx'), 'utf8')
  const header = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionHeader.tsx'), 'utf8')
  const engagement = readFileSync(resolve(process.cwd(), 'components/engagement/EngagementSummary.tsx'), 'utf8')

  it('uses fullscreen shell and flex height model with mobile viewport regions', () => {
    expect(learnRouteLayout).toContain('h-dvh')
    expect(learnRouteLayout).not.toContain('Header')
    expect(layout).toContain('flex-1')
    expect(layout).toContain('min-h-0')
    expect(layout).toContain('45dvh')
    expect(layout).toContain('env(safe-area-inset-bottom)')
    expect(layout).toContain('lg:grid-cols-2')
    expect(layout).toContain('pb-16')
  })

  it('mounts session header and collapsible engagement metrics above the learn grid', () => {
    expect(layout).toContain('LearnSessionHeader')
    expect(layout).toContain('EngagementSummary')
    expect(layout).toContain('resolveSessionUiState')
    expect(header).toContain('sticky top-0')
    expect(engagement).toContain('Accordion')
    expect(engagement).toContain('defaultExpanded')
  })

  it('keeps activity content mounted and moves focus to changed panel content', () => {
    expect(panel).toContain('headingRef.current?.focus')
    expect(panel).toContain('preventScroll')
    expect(panel).toContain('safe-area-inset-bottom')
  })
})
