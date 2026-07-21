import { createHash } from 'node:crypto'
import { apiErrorResponse, DomainError } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { finishAudioCreditSession, startAudioCreditSession } from '@/lib/credits/usage'

export const runtime = 'nodejs'

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1-mini'
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE || 'marin'

const INSTRUCTIONS = `You are the friendly English Pathway voice tutor. Help the learner practise English through brief, natural conversation. Correct errors gently, give one clear improvement at a time, and keep the conversation in English unless the learner needs a short explanation in another language. Do not claim to be human or reveal implementation details.`

const TOOLS = [
  { type: 'function', name: 'showGrammar', description: 'Show a concise grammar explanation in the learning panel.', parameters: { type: 'object', properties: { title: { type: 'string' }, markdown: { type: 'string' } }, required: ['title', 'markdown'], additionalProperties: false } },
  { type: 'function', name: 'showActivity', description: 'Show a curriculum activity by its validated ID.', parameters: { type: 'object', properties: { activityId: { type: 'string' } }, required: ['activityId'], additionalProperties: false } },
  { type: 'function', name: 'showQuestion', description: 'Show a multiple-choice question in the learning panel.', parameters: { type: 'object', properties: { prompt: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, correctIndex: { type: 'integer' } }, required: ['prompt', 'options', 'correctIndex'], additionalProperties: false } },
  { type: 'function', name: 'clearPanel', description: 'Clear the learning panel.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
  { type: 'function', name: 'fetchCurriculumContext', description: 'Retrieve relevant English Pathway curriculum context.', parameters: { type: 'object', properties: { query: { type: 'string' }, moduleId: { type: 'string' }, chapterId: { type: 'string' }, matchCount: { type: 'integer', minimum: 1, maximum: 5 } }, required: ['query'], additionalProperties: false } },
]

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

  const form = new FormData()
  form.set('sdp', sdp)
  form.set('session', JSON.stringify({
    type: 'realtime',
    model: REALTIME_MODEL,
    instructions: INSTRUCTIONS,
    audio: { output: { voice: REALTIME_VOICE } },
    tools: TOOLS,
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
