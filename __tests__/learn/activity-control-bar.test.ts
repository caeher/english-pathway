import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('activity control bar', () => {
  const source = readFileSync(resolve(process.cwd(), 'components/learn/ActivityControlBar.tsx'), 'utf8')
  it('offers consistent instructions, help, recovery, skip, and exit controls', () => {
    for (const label of ['Instructions', 'Need help', 'Restart', 'Skip', 'Exit']) expect(source).toContain(label)
    expect(source).toContain('window.confirm')
    expect(source).toContain('aria-expanded')
  })
  it('remounts only the activity game after confirmed restart', () => {
    const renderer = readFileSync(resolve(process.cwd(), 'components/learn/ActivityRenderer.tsx'), 'utf8')
    expect(renderer).toContain('setAttempt')
    expect(renderer).toContain('<div key={attempt}>')
  })
  it('connects help and safe exit at the shared activity shell', () => {
    const panel = readFileSync(resolve(process.cwd(), 'components/learn/DynamicContentPanel.tsx'), 'utf8')
    expect(panel).toContain('onHelp={onActivityDifficult}')
    expect(panel).toContain('onExit={clearPanel}')
    expect(panel).toContain("panel.kind !== 'activity'")
  })
})
