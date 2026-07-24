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
    expect(card).toContain('summary.primaryLabel')
    expect(card).toContain('Try something else')
    expect(card).toContain('Continue anyway')
    expect(card).toContain('Ask for explanation')
    expect(card).toContain('href="/review"')
    expect(card).toContain('primaryRef.current?.focus')
    expect(card).toContain('weakItemIndexes')
  })
})

describe('ActivityRenderer completion loop', () => {
  it('orchestrates completion card, follow-up planner, and tutor acknowledgement', () => {
    const renderer = readFileSync(resolve(root, 'components/learn/ActivityRenderer.tsx'), 'utf8')
    expect(renderer).toContain('ActivityCompletionCard')
    expect(renderer).toContain("phase === 'completed'")
    expect(renderer).toContain('planFollowUpPractice')
    expect(renderer).toContain('handleAcceptFollowUp')
    expect(renderer).toContain('handleDeclineFollowUp')
    expect(renderer).toContain('learnSessionActions.acknowledgeCompletion')
    expect(renderer).toContain('onRequestHelp')
    expect(renderer).toContain('onPhaseChange')
    expect(renderer).toContain('weakItemIndexes')
    expect(renderer).toContain('followUpDecision')
  })
})
