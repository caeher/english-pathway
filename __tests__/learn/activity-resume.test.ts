import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('activity resume UI contract', () => {
  it('exposes accessible resume and start-over actions', () => {
    const prompt = readFileSync(resolve(root, 'components/learn/ActivityResumePrompt.tsx'), 'utf8')
    expect(prompt).toContain('Continue where you left off?')
    expect(prompt).toContain('Resume')
    expect(prompt).toContain('Start over')
    expect(prompt).toContain('aria-live="polite"')
    expect(prompt).toContain('resumeRef.current?.focus()')
  })

  it('integrates snapshot restore flow in ActivityRenderer', () => {
    const renderer = readFileSync(resolve(root, 'components/learn/ActivityRenderer.tsx'), 'utf8')
    expect(renderer).toContain('ActivityResumePrompt')
    expect(renderer).toContain('loadSnapshot')
    expect(renderer).toContain('saveSnapshot')
    expect(renderer).toContain('removeSnapshot')
    expect(renderer).toContain('isActivityCompleted')
    expect(renderer).toContain("from '@/features/progress/client'")
    expect(renderer).toContain('initialProgress')
    expect(renderer).toContain('onProgressChange')
  })
})
