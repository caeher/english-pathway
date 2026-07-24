import { describe, expect, it } from 'vitest'
import {
  countPanelContentChars,
  deriveSpeakableText,
  isSafePanelText,
  panelBlockSchema,
  panelContentSchema,
  PANEL_CONTENT_LIMITS,
} from '@/lib/tutor/panel-content'

const validArticleExplanation = [
  { type: 'heading' as const, level: 2 as const, text: 'Articles: a and an' },
  { type: 'paragraph' as const, text: 'Use "a" before consonant sounds and "an" before vowel sounds.' },
  { type: 'example' as const, text: 'a cat, an apple' },
  {
    type: 'list' as const,
    items: ['a book', 'an hour', 'a university'],
  },
  { type: 'emphasis' as const, text: 'Remember: sound matters, not just the letter.' },
]

describe('panel content schema', () => {
  it('accepts valid pedagogical blocks', () => {
    const parsed = panelContentSchema.safeParse(validArticleExplanation)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(deriveSpeakableText(parsed.data)).toContain('Articles: a and an')
      expect(countPanelContentChars(parsed.data)).toBeLessThanOrEqual(PANEL_CONTENT_LIMITS.maxTotalChars)
    }
  })

  it('rejects malicious payloads', () => {
    const maliciousSamples = [
      [{ type: 'paragraph', text: '<script>alert(1)</script>' }],
      [{ type: 'paragraph', text: '<img onerror=alert(1)>' }],
      [{ type: 'paragraph', text: 'Visit https://evil.com' }],
      [{ type: 'paragraph', text: 'javascript:alert(1)' }],
      [{ type: 'paragraph', text: 'data:text/html,<script>' }],
      [{ type: 'paragraph', text: 'click\x00here' }],
      [],
      Array.from({ length: PANEL_CONTENT_LIMITS.maxBlocks + 1 }, () => ({
        type: 'paragraph' as const,
        text: 'x',
      })),
    ]

    for (const sample of maliciousSamples) {
      expect(panelContentSchema.safeParse(sample).success).toBe(false)
    }
  })

  it('rejects individual unsafe block fields', () => {
    expect(panelBlockSchema.safeParse({ type: 'paragraph', text: 'safe text' }).success).toBe(true)
    expect(panelBlockSchema.safeParse({ type: 'paragraph', text: '[link](javascript:alert)' }).success).toBe(false)
    expect(panelBlockSchema.safeParse({ type: 'list', items: ['ok', 'https://bad'] }).success).toBe(false)
    expect(panelBlockSchema.safeParse({ type: 'heading', level: 2, text: 'ok' }).success).toBe(true)
    expect(panelBlockSchema.safeParse({ type: 'heading', level: 4, text: 'bad level' }).success).toBe(false)
  })

  it('validates safePanelText helper', () => {
    expect(isSafePanelText('Hello world')).toBe(true)
    expect(isSafePanelText('Line one\nLine two', { allowNewlines: true })).toBe(true)
    expect(isSafePanelText('Line one\nLine two')).toBe(false)
    expect(isSafePanelText('<b>bold</b>')).toBe(false)
    expect(isSafePanelText('onclick=hack')).toBe(false)
  })
})
