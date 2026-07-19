import { describe, expect, it } from 'vitest'
import { motionDurations, pageTransition, panelTransition, resultTransition } from '@/lib/motion/system'

describe('shared motion system', () => {
  it('keeps orienting and feedback transitions within a short, consistent budget', () => {
    expect(motionDurations).toEqual({ feedback: 0.2, panel: 0.24, page: 0.28 })
    expect(pageTransition.initial).toEqual({ opacity: 0, y: 8 })
    expect(panelTransition.exit).toBeDefined()
    expect(resultTransition.initial).toEqual({ opacity: 0, scale: 0.96 })
  })
})
