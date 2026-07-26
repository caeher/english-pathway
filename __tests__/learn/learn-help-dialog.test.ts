import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('LearnHelpDialog', () => {
  it('provides accessible help copy and dialog structure', () => {
    const dialog = readFileSync(resolve(root, 'components/learn/LearnHelpDialog.tsx'), 'utf8')

    expect(dialog).toContain('aria-label="How Learn works"')
    expect(dialog).toContain('DialogTitle')
    expect(dialog).toContain('How Learn works')
    expect(dialog).toContain('Voice side')
    expect(dialog).toContain('Content side')
    expect(dialog).toContain('Closing this help')
    expect(dialog).toContain('Got it')
    expect(dialog).toContain('DialogClose')
    expect(dialog).toContain('CircleHelp')
  })
})
