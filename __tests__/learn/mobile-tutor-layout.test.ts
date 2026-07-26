import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const elevenLabsTutor = readFileSync(resolve(process.cwd(), 'components/voice/VoiceTutorProvider.tsx'), 'utf8')
const openAiTutor = readFileSync(resolve(process.cwd(), 'components/voice/OpenAiRealtimeTutorProvider.tsx'), 'utf8')
const learnLayout = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionLayout.tsx'), 'utf8')

describe('mobile tutor layout', () => {
  it('keeps only the visualizer and lesson start control before a session on mobile', () => {
    expect(elevenLabsTutor).toContain('flex flex-col gap-3 lg:hidden')
    expect(openAiTutor).toContain('flex flex-col gap-3 lg:hidden')
    expect(elevenLabsTutor).toContain('hidden sm:p-5 lg:block')
    expect(openAiTutor).toContain('hidden sm:p-5 lg:block')
  })

  it('allocates more of the mobile viewport to the activity panel', () => {
    expect(learnLayout).toContain('calc(32dvh-env(safe-area-inset-bottom))')
    expect(learnLayout).toContain('calc(55dvh-env(safe-area-inset-bottom))')
  })
})
