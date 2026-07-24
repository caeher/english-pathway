import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { motionProps, optionalMotion } from '@/lib/motion/useReducedMotion'

describe('reduced motion defaults', () => {
  it('returns an immediate non-translating motion configuration', () => {
    expect(motionProps(true)).toEqual({ initial: false, animate: { opacity: 1 }, transition: { duration: 0 } })
    expect(optionalMotion(true, { initial: { x: 20 } })).toEqual(motionProps(true))
  })

  it('applies the shared preference to animation-heavy surfaces', () => {
    for (const path of ['components/Header.tsx', 'components/voice/MicrophoneVisualizer.tsx', 'components/games/ActivityResult.tsx', 'components/games/Flashcard.tsx', 'components/games/Quiz.tsx', 'components/games/SentenceBuilder.tsx', 'components/games/WordMatch.tsx']) {
      expect(readFileSync(resolve(process.cwd(), path), 'utf8')).toContain('useReducedMotion')
    }
  })

  it('keeps CSS animation fallbacks disabled for the operating-system preference', () => {
    const css = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('--motion-standard: 0ms')
  })
})
