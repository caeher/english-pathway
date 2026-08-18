import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('mobile learning layout', () => {
  const layout = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionLayout.tsx'), 'utf8')
  const learnRouteLayout = readFileSync(resolve(process.cwd(), 'app/(learn)/layout.tsx'), 'utf8')
  const panel = readFileSync(resolve(process.cwd(), 'components/learn/DynamicContentPanel.tsx'), 'utf8')
  const header = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionHeader.tsx'), 'utf8')
  const engagement = readFileSync(resolve(process.cwd(), 'components/engagement/EngagementSummary.tsx'), 'utf8')
  const pageTransition = readFileSync(resolve(process.cwd(), 'components/transitions/PageTransition.tsx'), 'utf8')
  const learnTemplate = readFileSync(resolve(process.cwd(), 'app/(learn)/template.tsx'), 'utf8')

  it('uses fullscreen shell and flex height model with mobile viewport regions', () => {
    expect(learnRouteLayout).toContain('h-dvh')
    expect(learnRouteLayout).not.toContain('Header')
    expect(learnTemplate).toContain('layout="viewport"')
    expect(pageTransition).toContain("viewport: 'flex h-full min-h-0 flex-col'")
    expect(layout).toContain('shrink-0 bg-(--bg-secondary)/30')
    expect(layout).toContain('flex min-h-0 flex-1 flex-col bg-(--bg-primary) pb-16')
    expect(layout).toContain('lg:grid-cols-2')
    expect(layout).toContain('pb-16')
  })

  it('assigns desktop scroll ownership to the content panel column', () => {
    expect(layout).toContain('lg:overflow-hidden')
    expect(layout).toContain('lg:h-full')
    expect(layout).toMatch(/lg:overflow-hidden lg:pb-0/)
    expect(panel).toContain('h-full min-h-0 flex-col')
    expect(panel).toContain('min-h-0 flex-1 overflow-y-auto')
  })

  it('mounts session header and collapsible engagement metrics above the learn grid', () => {
    expect(layout).toContain('LearnSessionHeader')
    expect(layout).toContain('EngagementSummary')
    expect(layout).toContain('resolveSessionVisualState')
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
