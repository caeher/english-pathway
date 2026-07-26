import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PANEL_CONTENT_COLUMN_CLASS,
  PANEL_FULL_BLEED_CLASS,
  PANEL_MAIN_CLASS,
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

  it('defines a single vertical scroller with reinforced bottom gutter', () => {
    expect(PANEL_MAIN_CLASS).toContain('min-h-0')
    expect(PANEL_MAIN_CLASS).toContain('overflow-y-auto')
    expect(PANEL_MAIN_CLASS).toContain('pb-[var(--app-panel-pb)]')
    expect(PANEL_MAIN_CLASS).toContain('lg:pb-[var(--app-panel-pb-lg)]')
  })

  it('defines full-bleed offsets that cancel shell gutters', () => {
    expect(PANEL_FULL_BLEED_CLASS).toContain('-mx-[var(--app-panel-px)]')
    expect(PANEL_FULL_BLEED_CLASS).toContain('-mb-[var(--app-panel-pb)]')
    expect(PANEL_FULL_BLEED_CLASS).toContain('var(--app-panel-pt)')
    expect(PANEL_FULL_BLEED_CLASS).toContain('var(--app-panel-pb-lg)')
    expect(PANEL_FULL_BLEED_CLASS).not.toContain('-mx-4')
    expect(PANEL_FULL_BLEED_CLASS).not.toContain('2rem')
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
    expect(dashboardLayout).toContain('id="main-content"')
    expect(dashboardLayout).toContain('Skip to main content')
    expect(dashboardLayout).not.toContain('p-4 lg:p-6')
  })

  it('uses shared full-bleed class in review and chat detail routes', () => {
    expect(reviewLayout).toContain('PANEL_FULL_BLEED_CLASS')
    expect(chatLayout).toContain('PANEL_FULL_BLEED_CLASS')
    expect(reviewLayout).not.toContain('-mb-4')
    expect(chatLayout).not.toContain('-mb-4')
  })

  it('avoids forcing full viewport height in account page transitions', () => {
    expect(pageTransition).toContain('flex min-h-0 flex-col')
    expect(pageTransition).not.toContain('h-full')
    expect(pageTransition).not.toContain('flex-1')
  })
})
