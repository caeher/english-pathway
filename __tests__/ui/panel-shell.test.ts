import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PANEL_CONTENT_COLUMN_CLASS,
  PANEL_FULL_BLEED_CLASS,
  PANEL_MAIN_CLASS,
  PANEL_PAGE_FILL_CLASS,
  PANEL_SHELL_CSS_VARS,
} from '@/lib/layout/panel-shell'

describe('panel shell constants', () => {
  it('exports shared gutter CSS variables', () => {
    expect(PANEL_SHELL_CSS_VARS['--app-header-h']).toBe('4rem')
    expect(PANEL_SHELL_CSS_VARS['--app-panel-px']).toBe('1rem')
    expect(PANEL_SHELL_CSS_VARS['--app-panel-px-lg']).toBe('1.5rem')
    expect(PANEL_SHELL_CSS_VARS['--app-panel-pt']).toBe('1rem')
    expect(PANEL_SHELL_CSS_VARS['--app-panel-pt-lg']).toBe('1.5rem')
    expect(PANEL_SHELL_CSS_VARS['--app-panel-pb']).toBe('2rem')
    expect(PANEL_SHELL_CSS_VARS['--app-panel-pb-lg']).toBe('2.5rem')
  })

  it('makes main the constrained account content scroll owner', () => {
    expect(PANEL_MAIN_CLASS).toContain('min-h-0')
    expect(PANEL_MAIN_CLASS).toContain('overflow-y-auto')
    expect(PANEL_MAIN_CLASS).toContain('overscroll-y-contain')
    expect(PANEL_MAIN_CLASS).toContain('pb-[max(var(--app-panel-pb),env(safe-area-inset-bottom))]')
    expect(PANEL_MAIN_CLASS).toContain('lg:pb-[max(var(--app-panel-pb-lg),env(safe-area-inset-bottom))]')
  })

  it('defines full-bleed offsets that cancel shell gutters', () => {
    expect(PANEL_FULL_BLEED_CLASS).toContain('-mx-[var(--app-panel-px)]')
    expect(PANEL_FULL_BLEED_CLASS).toContain('-mb-[var(--app-panel-pb)]')
    expect(PANEL_FULL_BLEED_CLASS).toContain('flex-1')
    expect(PANEL_FULL_BLEED_CLASS).toContain('min-h-0')
    expect(PANEL_FULL_BLEED_CLASS).not.toContain('100dvh')
    expect(PANEL_FULL_BLEED_CLASS).not.toContain('-mx-4')
    expect(PANEL_FULL_BLEED_CLASS).not.toContain('2rem')
  })

  it('defines a fill wrapper for full-bleed routes with constrained height', () => {
    expect(PANEL_PAGE_FILL_CLASS).toContain('h-0')
    expect(PANEL_PAGE_FILL_CLASS).toContain('min-h-0')
    expect(PANEL_PAGE_FILL_CLASS).toContain('flex-1')
    expect(PANEL_PAGE_FILL_CLASS).toContain('overflow-hidden')
  })

  it('allows the content column to shrink inside the viewport', () => {
    expect(PANEL_CONTENT_COLUMN_CLASS).toContain('min-h-0')
    expect(PANEL_CONTENT_COLUMN_CLASS).toContain('overflow-hidden')
  })
})

describe('panel shell integration', () => {
  const dashboardLayout = readFileSync(
    resolve(process.cwd(), 'components/layouts/dashboard-layout.tsx'),
    'utf8',
  )
  const accountTemplate = readFileSync(
    resolve(process.cwd(), 'app/(account)/template.tsx'),
    'utf8',
  )
  const learnTemplate = readFileSync(
    resolve(process.cwd(), 'app/(learn)/template.tsx'),
    'utf8',
  )
  const reviewLayout = readFileSync(
    resolve(process.cwd(), 'app/(account)/review/layout.tsx'),
    'utf8',
  )
  const chatLayout = readFileSync(
    resolve(process.cwd(), 'app/(account)/chats/[id]/layout.tsx'),
    'utf8',
  )
  const pageTransition = readFileSync(
    resolve(process.cwd(), 'components/transitions/PageTransition.tsx'),
    'utf8',
  )

  it('wires dashboard layout to shared panel shell classes', () => {
    expect(dashboardLayout).toContain('PANEL_SHELL_STYLE')
    expect(dashboardLayout).toContain('PANEL_CONTENT_COLUMN_CLASS')
    expect(dashboardLayout).toContain('PANEL_MAIN_CLASS')
    expect(dashboardLayout).not.toContain('PANEL_MAIN_SCROLL_CLASS')
    expect(dashboardLayout).toContain('id="main-content"')
    expect(dashboardLayout).toContain('Skip to main content')
    expect(dashboardLayout).toContain('h-dvh')
    expect(dashboardLayout).toContain('max-h-dvh')
    expect(dashboardLayout).not.toContain('h-screen')
    expect(dashboardLayout).not.toContain('p-4 lg:p-6')
  })

  it('uses shared full-bleed class in review and chat detail routes', () => {
    expect(reviewLayout).toContain('PANEL_FULL_BLEED_CLASS')
    expect(reviewLayout).toContain('PANEL_PAGE_FILL_CLASS')
    expect(chatLayout).toContain('PANEL_FULL_BLEED_CLASS')
    expect(chatLayout).toContain('PANEL_PAGE_FILL_CLASS')
    expect(reviewLayout).not.toContain('-mb-4')
    expect(chatLayout).not.toContain('-mb-4')
  })

  it('exposes explicit page transition layout modes', () => {
    expect(pageTransition).toContain("PageTransitionLayout = 'content' | 'fill' | 'viewport'")
    expect(pageTransition).toContain("content: 'contents'")
    expect(pageTransition).toContain("fill: 'flex h-0 min-h-0 flex-1 flex-col overflow-hidden'")
    expect(pageTransition).toContain("viewport: 'flex h-full min-h-0 flex-col'")
    expect(pageTransition).toContain("layout = 'content'")
    expect(pageTransition).toContain('layoutClasses[layout]')
  })

  it('assigns content layout to account routes and viewport layout to learn routes', () => {
    expect(accountTemplate).toContain('layout="content"')
    expect(learnTemplate).toContain('layout="viewport"')
  })
})
