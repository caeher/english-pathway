import { createHash } from 'node:crypto'
import { apiErrorResponse, DomainError } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { finishAudioCreditSession, startAudioCreditSession } from '@/lib/credits/usage'
import { parseSessionPlanHeader } from '@/lib/learn/session-plan'
import { buildTutorInstructions } from '@/lib/tutor/instructions'
import { TUTOR_REALTIME_TOOLS } from '@/lib/tutor/realtime-tools'

export const runtime = 'nodejs'

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1-mini'
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE || 'marin'

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use the voice tutor.'), 'Authentication required')
  if (!process.env.OPENAI_API_KEY) return apiErrorResponse(new DomainError('DEPENDENCY_FAILURE', 'OpenAI voice is not configured.'), 'Voice unavailable')
  const sdp = await request.text()
  if (!sdp || sdp.length > 200_000) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid realtime connection request.'), 'Invalid realtime connection request')

  const credit = await startAudioCreditSession(context.supabase)
  if (!credit.allowed || !credit.sessionId || !credit.maxSeconds) {
    return apiErrorResponse(new DomainError('CREDITS_EXHAUSTED', credit.reason === 'active_session' ? 'A voice session is already active.' : 'Your 5 minutes of voice credits have been used.', 429), 'Voice credits exhausted')
  }

  const [profile, progress] = await Promise.all([
    context.supabase.from('profiles').select('level').eq('id', context.userId).maybeSingle(),
    context.supabase.from('user_progress').select('last_chapter_id, last_activity_id').eq('user_id', context.userId).maybeSingle(),
  ])

  const sessionPlan = parseSessionPlanHeader(request.headers.get('X-Session-Plan'))
  const instructions = buildTutorInstructions({
    level: profile.data?.level ?? null,
    lastChapterId: progress.data?.last_chapter_id ?? null,
    lastActivityId: progress.data?.last_activity_id ?? null,
    plan: sessionPlan,
  })

  const form = new FormData()
  form.set('sdp', sdp)
  form.set('session', JSON.stringify({
    type: 'realtime',
    model: REALTIME_MODEL,
    instructions,
    audio: { output: { voice: REALTIME_VOICE } },
    tools: TUTOR_REALTIME_TOOLS,
  }))

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Safety-Identifier': createHash('sha256').update(context.userId).digest('hex'),
      },
      body: form,
    })
    const answerSdp = await response.text()
    if (!response.ok || !answerSdp) {
      await finishAudioCreditSession(context.supabase, credit.sessionId, 0).catch(() => {})
      return apiErrorResponse(new DomainError('DEPENDENCY_FAILURE', 'OpenAI voice could not start.'), 'Voice unavailable')
    }
    return new Response(answerSdp, {
      headers: {
        'Content-Type': 'application/sdp',
        'X-Audio-Credit-Session': credit.sessionId,
        'X-Audio-Credit-Max-Seconds': String(credit.maxSeconds),
      },
    })
  } catch {
    await finishAudioCreditSession(context.supabase, credit.sessionId, 0).catch(() => {})
    return apiErrorResponse(new DomainError('DEPENDENCY_FAILURE', 'OpenAI voice could not start.'), 'Voice unavailable')
  }
}
