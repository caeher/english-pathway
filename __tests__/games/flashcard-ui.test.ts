import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const flashcard = readFileSync(resolve(process.cwd(), 'components/games/Flashcard.tsx'), 'utf8')

describe('Flashcard activity UI', () => {
  it('shows the answer and example without a separate reveal action', () => {
    expect(flashcard).not.toContain('Show answer')
    expect(flashcard).toContain('{card.back}')
    expect(flashcard).toContain('{card.example}')
    expect(flashcard).toContain("const revealed = true")
  })

  it('keeps all three recall grades directly available', () => {
    expect(flashcard).toContain("label: 'I recalled it'")
    expect(flashcard).toContain("label: 'Not sure'")
    expect(flashcard).toContain("label: \"Couldn't recall\"")
  })
})
