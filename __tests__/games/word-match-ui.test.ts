import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const wordMatch = readFileSync(resolve(process.cwd(), 'components/games/WordMatch.tsx'), 'utf8')

describe('WordMatch activity UI', () => {
  it('keeps the shuffled right column stable during an attempt', () => {
    expect(wordMatch).toContain('const [shuffledRight] = useState(() => shuffleArray(')
    expect(wordMatch).not.toContain('useMemo(() => shuffleArray')
  })
})
