import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pronunciation = readFileSync(resolve(process.cwd(), 'components/games/Pronunciation.tsx'), 'utf8')
const transcriptionRoute = readFileSync(resolve(process.cwd(), 'app/api/audio/transcribe/route.ts'), 'utf8')

describe('pronunciation recording fallback', () => {
  it('offers secure recording when browser speech recognition is unavailable', () => {
    expect(pronunciation).toContain("fetch('/api/audio/transcribe'")
    expect(pronunciation).toContain('Record with secure transcription')
    expect(pronunciation).toContain("error === 'network'")
  })

  it('protects transcription with authentication, limits, and a short upload cap', () => {
    expect(transcriptionRoute).toContain('getAuthenticatedContext()')
    expect(transcriptionRoute).toContain("route: '/api/audio/transcribe'")
    expect(transcriptionRoute).toContain('MAX_AUDIO_BYTES')
  })
})
