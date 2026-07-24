import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('english assistant accessibility contract', () => {
  const assistant = readFileSync(resolve(process.cwd(), 'components/EnglishAssistant.tsx'), 'utf8')
  const sheet = readFileSync(resolve(process.cwd(), 'components/ui/sheet.tsx'), 'utf8')
  const viewportHook = readFileSync(resolve(process.cwd(), 'lib/ui/use-visual-viewport-height.ts'), 'utf8')

  it('uses an accessible sheet dialog instead of a fixed section panel', () => {
    expect(assistant).toContain('Sheet')
    expect(assistant).toContain('SheetTrigger')
    expect(assistant).toContain('SheetContent')
    expect(assistant).toContain('SheetTitle')
    expect(assistant).toContain('SheetDescription')
    expect(assistant).not.toMatch(/<section[\s\S]*aria-label="English learning assistant"/)
  })

  it('routes focus into the input when the dialog opens', () => {
    expect(assistant).toContain('onOpenAutoFocus')
    expect(assistant).toContain('inputRef.current?.focus()')
  })

  it('announces assistant replies, sending state, and errors through separate live regions', () => {
    expect(assistant).toContain('latestAssistantReply')
    expect(assistant).toContain('sendingStatus')
    expect(assistant).toContain('aria-live="polite"')
    expect(assistant).toContain('role="alert"')
    expect(assistant).toContain('aria-live="assertive"')
    expect(assistant).not.toMatch(/flex-1 space-y-3 overflow-y-auto[\s\S]*aria-live="polite"/)
  })

  it('adapts the sheet to mobile keyboard and safe areas', () => {
    expect(assistant).toContain('useVisualViewportHeight')
    expect(assistant).toContain('handleInputFocus')
    expect(assistant).toContain('scrollIntoView')
    expect(sheet).toContain('100dvh')
    expect(sheet).toContain('safe-area-inset-bottom')
    expect(viewportHook).toContain('visualViewport')
  })

  it('keeps touch targets and elevated stacking above the learn workspace', () => {
    expect(assistant).toContain('min-h-11')
    expect(assistant).toContain('z-60')
    expect(sheet).toContain('z-60')
  })

  it('builds the sheet primitive on radix dialog', () => {
    expect(sheet).toContain('@radix-ui/react-dialog')
    expect(sheet).toContain('SheetPrimitive.Content')
  })
})
