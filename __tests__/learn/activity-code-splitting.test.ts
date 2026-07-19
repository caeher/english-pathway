import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('activity renderer code splitting', () => {
  const source = readFileSync(resolve(process.cwd(), 'components/learn/ActivityRenderer.tsx'), 'utf8')

  it('loads each activity renderer dynamically without server rendering it', () => {
    expect(source).toContain("import dynamic from 'next/dynamic'")
    expect(source).toContain('ssr: false')
    for (const game of ['Quiz', 'Flashcard', 'WordMatch', 'SentenceBuilder', 'SVGInteractive', 'WordScramble', 'Listening', 'Dictation', 'Pronunciation', 'DragDrop']) {
      expect(source).toContain(`components/games/${game}`)
    }
  })

  it('keeps layout stable and exposes accessible loading and recovery states', () => {
    expect(source).toContain('min-h-56')
    expect(source).toContain('role="status"')
    expect(source).toContain('role="alert"')
    expect(source).toContain('Try again')
  })
})
