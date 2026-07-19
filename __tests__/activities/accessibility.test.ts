import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const gameFiles = [
  'Quiz.tsx', 'Flashcard.tsx', 'WordMatch.tsx', 'SentenceBuilder.tsx', 'SVGInteractive.tsx',
  'WordScramble.tsx', 'Listening.tsx', 'Dictation.tsx', 'Pronunciation.tsx', 'DragDrop.tsx', 'SvgScene.tsx',
]

describe('learning activity accessibility contract', () => {
  it.each(gameFiles)('%s exposes labelled controls or regions', (file) => {
    const source = readFileSync(resolve(process.cwd(), 'components/games', file), 'utf8')
    expect(source).toMatch(/aria-label|role="region"|role="group"/)
  })

  it('keeps drag and SVG alternatives keyboard-operable', () => {
    const dragDrop = readFileSync(resolve(process.cwd(), 'components/games/DragDrop.tsx'), 'utf8')
    const svgScene = readFileSync(resolve(process.cwd(), 'components/games/SvgScene.tsx'), 'utf8')
    expect(dragDrop).toContain("e.key === 'Enter' || e.key === ' '")
    expect(svgScene).toContain("event.key === 'Enter' || event.key === ' '")
    expect(svgScene).toContain("element.setAttribute('tabindex', '0')")
  })

  it('announces interaction results across every activity family', () => {
    for (const file of ['Quiz.tsx', 'WordMatch.tsx', 'SentenceBuilder.tsx', 'SVGInteractive.tsx', 'Listening.tsx', 'Dictation.tsx', 'DragDrop.tsx']) {
      const source = readFileSync(resolve(process.cwd(), 'components/games', file), 'utf8')
      expect(source).toContain('aria-live="polite"')
    }
  })
})
