import { describe, expect, it } from 'vitest'
import { executeTutorTool } from '@/lib/learn/execute-tutor-tool'
import { showGrammarActionSchema, showQuestionActionSchema } from '@/lib/tutor/schemas'
import { deriveSpeakableText, panelContentSchema } from '@/lib/tutor/panel-content'
import { learnSessionActions, useLearnSessionStore } from '@/stores/useLearnSessionStore'
import { legitimatePanelSamples, maliciousPanelSamples } from './fixtures/panel-output'

describe('panel output security', () => {
  it('rejects all malicious grammar payloads', () => {
    for (const sample of maliciousPanelSamples) {
      if ('prompt' in sample) continue
      const payload = 'title' in sample
        ? { title: sample.title, blocks: sample.blocks }
        : { blocks: sample.blocks }
      expect(showGrammarActionSchema.safeParse(payload).success, sample.label).toBe(false)
    }
  })

  it('rejects malicious question payloads', () => {
    for (const sample of maliciousPanelSamples) {
      if (!('prompt' in sample)) continue
      expect(showQuestionActionSchema.safeParse(sample).success, sample.label).toBe(false)
    }
  })

  it('accepts legitimate pedagogical panel content', () => {
    for (const sample of legitimatePanelSamples) {
      const parsed = panelContentSchema.safeParse(sample.blocks)
      expect(parsed.success, sample.title).toBe(true)
      if (parsed.success) {
        expect(deriveSpeakableText(parsed.data).length).toBeGreaterThan(0)
      }
      expect(showGrammarActionSchema.safeParse(sample).success, sample.title).toBe(true)
    }
  })

  it('keeps the panel safe when executor rejects grammar output', async () => {
    learnSessionActions.resetSession()
    learnSessionActions.setExplanation(
      [{ type: 'paragraph', text: 'Existing safe explanation.' }],
      'Safe lesson',
    )

    await executeTutorTool('showGrammar', {
      title: 'Attack',
      blocks: [{ type: 'paragraph', text: '<script>alert(1)</script>' }],
    })

    const state = useLearnSessionStore.getState()
    expect(state.panel).toEqual({
      kind: 'explanation',
      title: 'Safe lesson',
      blocks: [{ type: 'paragraph', text: 'Existing safe explanation.' }],
    })
    expect(state.panelNotice).toBeTruthy()
  })
})
