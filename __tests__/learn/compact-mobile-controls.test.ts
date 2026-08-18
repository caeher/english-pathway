import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('compact mobile voice controls and responsive activity toolbar', () => {
  const visualizerCode = readFileSync(
    resolve(root, 'components/voice/MicrophoneVisualizer.tsx'),
    'utf8'
  )
  const voiceTutorCode = readFileSync(
    resolve(root, 'components/voice/VoiceTutorProvider.tsx'),
    'utf8'
  )
  const openAiTutorCode = readFileSync(
    resolve(root, 'components/voice/OpenAiRealtimeTutorProvider.tsx'),
    'utf8'
  )
  const activityBarCode = readFileSync(
    resolve(root, 'components/learn/ActivityControlBar.tsx'),
    'utf8'
  )

  describe('MicrophoneVisualizer', () => {
    it('supports compact and muted modes with accessible states', () => {
      expect(visualizerCode).toContain('muted = false')
      expect(visualizerCode).toContain('compact = false')
      expect(visualizerCode).toContain('if (compact)')
      expect(visualizerCode).toContain('Voice audio bar visualizer - microphone muted')
      expect(visualizerCode).toContain('Voice audio bar visualizer - audio detected')
      expect(visualizerCode).toContain('Voice audio bar visualizer - active')
      expect(visualizerCode).toContain('Voice audio bar visualizer - standby')
    })

    it('renders compact visualizer with flexible bar container', () => {
      expect(visualizerCode).toContain('h-11')
      expect(visualizerCode).toContain('flex-1 min-w-0')
    })
  })

  describe('VoiceTutorProvider mobile states', () => {
    it('renders compact idle state on mobile without microphone visualizer card', () => {
      const mobilePreflight = voiceTutorCode.slice(
        voiceTutorCode.indexOf('flex flex-col gap-3 lg:hidden'),
        voiceTutorCode.indexOf('hidden sm:p-5 lg:block')
      )

      expect(mobilePreflight).not.toContain('<MicrophoneVisualizer')
      expect(mobilePreflight).not.toContain('MICROPHONE STANDBY')
      expect(mobilePreflight).toContain('className="w-full min-h-[44px]"')
      expect(mobilePreflight).toContain('Start voice lesson')
    })

    it('communicates connecting state progress on the compact button', () => {
      const mobilePreflight = voiceTutorCode.slice(
        voiceTutorCode.indexOf('flex flex-col gap-3 lg:hidden'),
        voiceTutorCode.indexOf('hidden sm:p-5 lg:block')
      )

      expect(mobilePreflight).toContain('connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />')
      expect(mobilePreflight).toContain("connecting ? 'Connecting...' : mode === 'voice' ? 'Start voice lesson' : 'Start text lesson'")
      expect(mobilePreflight).toContain('disabled={connecting}')
    })

    it('renders error notifications when an error occurs on mobile preflight', () => {
      const mobilePreflight = voiceTutorCode.slice(
        voiceTutorCode.indexOf('flex flex-col gap-3 lg:hidden'),
        voiceTutorCode.indexOf('hidden sm:p-5 lg:block')
      )

      expect(mobilePreflight).toContain('{error && <InlineError message={error} onRetry={() => void start()} />}')
    })

    it('lays out Mute, visualizer, and End in a single horizontal row on small screens when active', () => {
      expect(voiceTutorCode).toContain('flex items-center gap-2 sm:gap-3 w-full')
      expect(voiceTutorCode).toContain('<MicrophoneVisualizer stream={microphoneStream} active muted={isMuted} compact />')
      expect(voiceTutorCode).toContain('min-h-[44px] min-w-[44px]')
      expect(voiceTutorCode).toContain("aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}")
      expect(voiceTutorCode).toContain('aria-label="End voice session"')
      expect(voiceTutorCode).toContain('<span className="hidden sm:inline">End</span>')
      expect(voiceTutorCode).toContain('<span className="hidden sm:inline">{isMuted ? \'Unmute\' : \'Mute\'}</span>')
    })

    it('preserves the desktop preflight card on lg breakpoint', () => {
      expect(voiceTutorCode).toContain('hidden sm:p-5 lg:block')
      expect(voiceTutorCode).toContain('<MicrophoneVisualizer stream={microphoneStream} active={microphoneState === \'ready\' || connecting || active} />')
    })
  })

  describe('OpenAiRealtimeTutorProvider mobile states', () => {
    it('renders compact idle state on mobile without microphone visualizer card', () => {
      const mobilePreflight = openAiTutorCode.slice(
        openAiTutorCode.indexOf('flex flex-col gap-3 lg:hidden'),
        openAiTutorCode.indexOf('hidden sm:p-5 lg:block')
      )

      expect(mobilePreflight).not.toContain('<MicrophoneVisualizer')
      expect(mobilePreflight).not.toContain('MICROPHONE STANDBY')
      expect(mobilePreflight).toContain('className="w-full min-h-[44px]"')
      expect(mobilePreflight).toContain('Start voice lesson')
    })

    it('communicates connecting state progress on the compact button', () => {
      const mobilePreflight = openAiTutorCode.slice(
        openAiTutorCode.indexOf('flex flex-col gap-3 lg:hidden'),
        openAiTutorCode.indexOf('hidden sm:p-5 lg:block')
      )

      expect(mobilePreflight).toContain('connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />')
      expect(mobilePreflight).toContain("connecting ? 'Connecting…' : 'Start voice lesson'")
      expect(mobilePreflight).toContain('disabled={isStartDisabled}')
    })

    it('renders error and quota alerts when present on mobile preflight', () => {
      const mobilePreflight = openAiTutorCode.slice(
        openAiTutorCode.indexOf('flex flex-col gap-3 lg:hidden'),
        openAiTutorCode.indexOf('hidden sm:p-5 lg:block')
      )

      expect(mobilePreflight).toContain('{error && <InlineError message={error} onRetry={() => void start()} />}')
      expect(mobilePreflight).toContain('{creditsError && !error && <InlineError message="Voice credits could not be loaded. Please check your connection." onRetry={() => void loadCredits()} />}')
    })

    it('lays out Mute, visualizer, and End in a single horizontal row on small screens when active', () => {
      expect(openAiTutorCode).toContain('flex items-center gap-2 sm:gap-3 w-full')
      expect(openAiTutorCode).toContain('<MicrophoneVisualizer stream={stream} active muted={muted} compact />')
      expect(openAiTutorCode).toContain('min-h-[44px] min-w-[44px]')
      expect(openAiTutorCode).toContain("aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}")
      expect(openAiTutorCode).toContain('aria-label="End voice session"')
      expect(openAiTutorCode).toContain('<span className="hidden sm:inline">End</span>')
      expect(openAiTutorCode).toContain('<span className="hidden sm:inline">{muted ? \'Unmute\' : \'Mute\'}</span>')
    })

    it('preserves the desktop preflight card on lg breakpoint', () => {
      expect(openAiTutorCode).toContain('hidden sm:p-5 lg:block')
    })
  })

  describe('ActivityControlBar responsive toolbar', () => {
    it('renders icon-only buttons on mobile and reveals text labels on sm breakpoint', () => {
      expect(activityBarCode).toContain('min-h-[44px] min-w-[44px]')
      expect(activityBarCode).toContain('<span className="hidden sm:inline">Instructions</span>')
      expect(activityBarCode).toContain('<span className="hidden sm:inline">Need help</span>')
      expect(activityBarCode).toContain('<span className="hidden sm:inline">Restart</span>')
      expect(activityBarCode).toContain('<span className="hidden sm:inline">Skip</span>')
      expect(activityBarCode).toContain('<span className="hidden sm:inline">Exit</span>')
    })

    it('provides accessible names and tooltip titles on all action buttons', () => {
      expect(activityBarCode).toContain('aria-label="Instructions"')
      expect(activityBarCode).toContain('title="Instructions"')
      expect(activityBarCode).toContain('aria-label="Need help"')
      expect(activityBarCode).toContain('title="Need help"')
      expect(activityBarCode).toContain('aria-label="Restart activity"')
      expect(activityBarCode).toContain('title="Restart"')
      expect(activityBarCode).toContain('aria-label="Skip activity"')
      expect(activityBarCode).toContain('title="Skip"')
      expect(activityBarCode).toContain('aria-label="Exit activity"')
      expect(activityBarCode).toContain('title="Exit"')
    })
  })
})
