import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('ActivityCompletionCard accessibility contract', () => {
  it('exposes status region, live announcements, and action controls', () => {
    const card = readFileSync(resolve(root, 'components/learn/ActivityCompletionCard.tsx'), 'utf8')
    expect(card).toContain('ActivityCompletionCard')
    expect(card).toContain('role="status"')
    expect(card).toContain('aria-live="polite"')
    expect(card).toContain('Try again')
    expect(card).toContain('Ask for explanation')
    expect(card).toContain('href="/review"')
    expect(card).toContain('primaryRef.current?.focus')
  })
})

describe('ActivityRenderer completion loop', () => {
  it('orchestrates completion card, next activity resolution, and tutor acknowledgement', () => {
    const renderer = readFileSync(resolve(root, 'components/learn/ActivityRenderer.tsx'), 'utf8')
    expect(renderer).toContain('ActivityCompletionCard')
    expect(renderer).toContain("phase === 'completed'")
    expect(renderer).toContain('resolveNextActivityId')
    expect(renderer).toContain('learnSessionActions.acknowledgeCompletion')
    expect(renderer).toContain('onRequestHelp')
    expect(renderer).toContain('onPhaseChange')
  })
})
