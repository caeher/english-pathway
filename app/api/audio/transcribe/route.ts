import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { apiErrorResponse, DomainError } from '@/lib/api/errors'
import { withApiTimeout } from '@/lib/api/timeout'
import { getAuthenticatedContext } from '@/lib/api/context'
import { enforceRateLimit } from '@/lib/security/enforce-rate-limit'

export const runtime = 'nodejs'

const TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions'
const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe'
const MAX_AUDIO_BYTES = 8 * 1024 * 1024

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to verify pronunciation.'), 'Authentication required')

  const limited = await enforceRateLimit({
    request,
    route: '/api/audio/transcribe',
    userId: context.userId,
  })
  if (limited) return limited

  if (!process.env.OPENAI_API_KEY) {
    return apiErrorResponse(new DomainError('DEPENDENCY_FAILURE', 'Speech transcription is not configured.'), 'Speech transcription unavailable')
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return apiErrorResponse(new DomainError('INVALID_INPUT', 'Audio upload is invalid.'), 'Invalid audio')
  }

  const audio = formData.get('audio')
  if (!(audio instanceof File) || !audio.type.startsWith('audio/') || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
    return apiErrorResponse(new DomainError('INVALID_INPUT', 'Upload a short audio recording smaller than 8 MB.'), 'Invalid audio')
  }

  const upstreamForm = new FormData()
  upstreamForm.set('file', audio, audio.name || 'pronunciation.webm')
  upstreamForm.set('model', TRANSCRIPTION_MODEL)
  upstreamForm.set('language', 'en')

  try {
    const response = await withApiTimeout(fetch(TRANSCRIPTION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Safety-Identifier': createHash('sha256').update(context.userId).digest('hex'),
      },
      body: upstreamForm,
    }), 20_000)

    if (!response.ok) {
      return apiErrorResponse(new DomainError('DEPENDENCY_FAILURE', 'Speech transcription is temporarily unavailable.'), 'Speech transcription unavailable')
    }

    const payload = await response.json() as { text?: unknown }
    const transcript = typeof payload.text === 'string' ? payload.text.trim() : ''
    if (!transcript) {
      return apiErrorResponse(new DomainError('DEPENDENCY_FAILURE', 'No speech was detected. Please try recording again.'), 'No speech detected')
    }

    return NextResponse.json({ transcript })
  } catch (error) {
    if (error instanceof DomainError && error.code === 'TIMEOUT') {
      return apiErrorResponse(error, 'Speech transcription timed out')
    }
    return apiErrorResponse(new DomainError('DEPENDENCY_FAILURE', 'Speech transcription is temporarily unavailable.'), 'Speech transcription unavailable')
  }
}
