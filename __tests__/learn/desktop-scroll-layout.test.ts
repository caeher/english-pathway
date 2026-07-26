import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('desktop learn scroll layout', () => {
  it('keeps the height chain and desktop scroll contract in critical layout files', () => {
    const pageTransition = readFileSync(resolve(root, 'components/transitions/PageTransition.tsx'), 'utf8')
    const layout = readFileSync(resolve(root, 'components/learn/LearnSessionLayout.tsx'), 'utf8')
    const panel = readFileSync(resolve(root, 'components/learn/DynamicContentPanel.tsx'), 'utf8')
    const voiceTutor = readFileSync(resolve(root, 'components/voice/VoiceTutorProvider.tsx'), 'utf8')
    const openAiTutor = readFileSync(resolve(root, 'components/voice/OpenAiRealtimeTutorProvider.tsx'), 'utf8')

    const learnTemplate = readFileSync(resolve(root, 'app/(learn)/template.tsx'), 'utf8')

    expect(pageTransition).toContain("viewport: 'flex h-full min-h-0 flex-col'")
    expect(learnTemplate).toContain('layout="viewport"')
    expect(layout).toContain('lg:overflow-hidden')
    expect(layout).toContain('lg:h-full')
    expect(layout).toMatch(/lg:overflow-hidden lg:pb-0/)
    expect(panel).toContain('h-full min-h-0 flex-col')
    expect(panel).toContain('min-h-0 flex-1 overflow-y-auto')
    expect(voiceTutor).toContain('lg:overflow-hidden')
    expect(openAiTutor).toContain('lg:overflow-hidden')
  })
})
