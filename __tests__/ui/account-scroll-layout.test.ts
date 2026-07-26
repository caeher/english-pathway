import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('account scroll layout', () => {
  const dashboardLayout = readFileSync(
    resolve(process.cwd(), 'components/layouts/dashboard-layout.tsx'),
    'utf8',
  )
  const panelShell = readFileSync(
    resolve(process.cwd(), 'lib/layout/panel-shell.ts'),
    'utf8',
  )
  const settingsPage = readFileSync(
    resolve(process.cwd(), 'components/pages/SettingsPage.tsx'),
    'utf8',
  )
  const accountTemplate = readFileSync(
    resolve(process.cwd(), 'app/(account)/template.tsx'),
    'utf8',
  )

  it('keeps a single scroll owner inside the dashboard viewport shell', () => {
    expect(dashboardLayout).toContain('overflow-hidden')
    expect(dashboardLayout).toContain('h-dvh')
    expect(panelShell).toContain('overflow-hidden')
    expect(panelShell).toContain('overflow-y-auto')
    expect(panelShell).toContain('overscroll-y-contain')
    expect(dashboardLayout).toContain('id="main-content"')
    expect(dashboardLayout).toContain('PANEL_MAIN_CLASS')
  })

  it('uses fill page transitions for account routes without viewport height in settings content', () => {
    expect(accountTemplate).toContain('layout="fill"')
    expect(settingsPage).toContain('PageContainer')
    expect(settingsPage).not.toContain('min-h-screen')
    expect(settingsPage).not.toContain('min-h-full')
    expect(settingsPage).not.toMatch(/\bpb-\d/)
  })
})
