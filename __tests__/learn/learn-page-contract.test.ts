import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('Learn page contract', () => {
  it('protects /learn in middleware auth guard', () => {
    const middleware = readFileSync(resolve(root, 'lib/supabase/middleware.ts'), 'utf8')
    expect(middleware).toContain("pathname.startsWith('/learn')")
  })

  it('redirects legacy curriculum query params to the canonical Learn path', () => {
    const page = readFileSync(resolve(root, 'app/(learn)/learn/page.tsx'), 'utf8')

    expect(page).toContain('params.moduleId || params.chapterId || params.activityId')
    expect(page).toContain('redirect(LEARN_PATH)')
    expect(page).not.toContain('initialActivityId')
    expect(page).not.toContain('resolveActivityByIdValidated')
  })
})

describe('tutor providers', () => {
  it('does not auto-launch activities on mount', () => {
    const voiceProvider = readFileSync(resolve(root, 'components/voice/VoiceTutorProvider.tsx'), 'utf8')
    const openAiProvider = readFileSync(resolve(root, 'components/voice/OpenAiRealtimeTutorProvider.tsx'), 'utf8')

    expect(voiceProvider).not.toContain('initialActivityId')
    expect(voiceProvider).not.toContain('showActivity')
    expect(openAiProvider).not.toContain('initialActivityId')
    expect(openAiProvider).not.toContain('showActivity')
  })

  it('detects OpenAI microphone support after hydration', () => {
    const openAiProvider = readFileSync(resolve(root, 'components/voice/OpenAiRealtimeTutorProvider.tsx'), 'utf8')

    expect(openAiProvider).toContain('const [voiceSupported, setVoiceSupported] = useState(false)')
    expect(openAiProvider).toContain('setVoiceSupported(Boolean(navigator.mediaDevices?.getUserMedia))')
    expect(openAiProvider).not.toContain("const voiceSupported = typeof navigator !== 'undefined'")
  })

  it('maintains active non-terminal sessions without disconnect timers during waiting states', () => {
    const openAiProvider = readFileSync(resolve(root, 'components/voice/OpenAiRealtimeTutorProvider.tsx'), 'utf8')
    const elevenLabsProvider = readFileSync(resolve(root, 'components/voice/VoiceTutorProvider.tsx'), 'utf8')

    expect(openAiProvider).toContain('Start the lesson now.')
    expect(openAiProvider).not.toContain('setActivityPauseReady')
    expect(openAiProvider).not.toContain('ACTIVITY_VOICE_WRAP_UP_DELAY_MS')
    expect(elevenLabsProvider).not.toContain('activityPauseSawSpeechRef')
    expect(elevenLabsProvider).not.toContain('ACTIVITY_VOICE_WRAP_UP_DELAY_MS')
    expect(elevenLabsProvider).not.toContain('pausedForActivityRef')
  })
})
