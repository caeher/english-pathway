import { describe, expect, it } from 'vitest'
import { extractMarkdownHeadings, slugifyHeading } from '@/lib/content/markdown'

describe('pedagogical markdown helpers', () => {
  it('creates stable accessible heading ids, including duplicates', () => {
    expect(slugifyHeading('What is English?')).toBe('what-is-english')
    expect(extractMarkdownHeadings('# Intro\n## What is English?\n## What is English?')).toEqual([
      { level: 1, text: 'Intro', id: 'intro' },
      { level: 2, text: 'What is English?', id: 'what-is-english' },
      { level: 2, text: 'What is English?', id: 'what-is-english-2' },
    ])
  })

  it('supports GFM-oriented author content without storing learner data', () => {
    const headings = extractMarkdownHeadings('## **Tip**\n\n| Term | Meaning |\n| --- | --- |\n| hello | greeting |')
    expect(headings[0]?.text).toBe('Tip')
  })
})
