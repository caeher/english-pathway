import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const gameFiles = [
  'Quiz.tsx', 'Flashcard.tsx', 'WordMatch.tsx', 'SentenceBuilder.tsx',
  'WordScramble.tsx', 'Listening.tsx', 'Dictation.tsx', 'Pronunciation.tsx', 'DragDrop.tsx',
]

describe('learning activity accessibility contract', () => {
  it.each(gameFiles)('%s exposes labelled controls or regions', (file) => {
    const source = readFileSync(resolve(process.cwd(), 'components/games', file), 'utf8')
    expect(source).toMatch(/aria-label|role="region"|role="group"/)
  })

  it('keeps drag alternatives keyboard-operable', () => {
    const dragDrop = readFileSync(resolve(process.cwd(), 'components/games/DragDrop.tsx'), 'utf8')
    expect(dragDrop).toContain("e.key === 'Enter' || e.key === ' '")
  })

  it('announces interaction results across every activity family', () => {
    for (const file of ['Quiz.tsx', 'WordMatch.tsx', 'SentenceBuilder.tsx', 'Listening.tsx', 'Dictation.tsx', 'DragDrop.tsx']) {
      const source = readFileSync(resolve(process.cwd(), 'components/games', file), 'utf8')
      expect(source).toContain('aria-live="polite"')
    }
  })
})
