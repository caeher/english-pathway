import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const elevenLabsTutor = readFileSync(resolve(process.cwd(), 'components/voice/VoiceTutorProvider.tsx'), 'utf8')
const openAiTutor = readFileSync(resolve(process.cwd(), 'components/voice/OpenAiRealtimeTutorProvider.tsx'), 'utf8')
const learnLayout = readFileSync(resolve(process.cwd(), 'components/learn/LearnSessionLayout.tsx'), 'utf8')

describe('mobile tutor layout', () => {
  it('keeps only the lesson start control and errors before a session on mobile', () => {
    expect(elevenLabsTutor).toContain('flex flex-col gap-3 lg:hidden')
    expect(openAiTutor).toContain('flex flex-col gap-3 lg:hidden')
    expect(elevenLabsTutor).toContain('hidden sm:p-5 lg:block')
    expect(openAiTutor).toContain('hidden sm:p-5 lg:block')

    // Mobile preflight container does not include idle visualizer
    const elevenMobilePreflight = elevenLabsTutor.slice(
      elevenLabsTutor.indexOf('flex flex-col gap-3 lg:hidden'),
      elevenLabsTutor.indexOf('hidden sm:p-5 lg:block')
    )
    expect(elevenMobilePreflight).not.toContain('<MicrophoneVisualizer')
    expect(elevenMobilePreflight).toContain('Start voice lesson')
    expect(elevenMobilePreflight).toContain('min-h-[44px]')

    const openAiMobilePreflight = openAiTutor.slice(
      openAiTutor.indexOf('flex flex-col gap-3 lg:hidden'),
      openAiTutor.indexOf('hidden sm:p-5 lg:block')
    )
    expect(openAiMobilePreflight).not.toContain('<MicrophoneVisualizer')
    expect(openAiMobilePreflight).toContain('Start voice lesson')
    expect(openAiMobilePreflight).toContain('min-h-[44px]')
  })

  it('allocates vertical space to the activity panel without preserving idle-card min-height spacers', () => {
    expect(learnLayout).toContain('shrink-0 bg-(--bg-secondary)/30')
    expect(learnLayout).toContain('flex min-h-0 flex-1 flex-col bg-(--bg-primary) pb-16')
    expect(learnLayout).not.toContain('min-h-[min(220px')
    expect(learnLayout).not.toContain('min-h-[calc(55dvh')
  })
})
