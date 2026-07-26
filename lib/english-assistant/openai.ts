import type { AssistantMessage } from './schema'
import type { ActivityContext } from './context'
import type { EnglishAssistantLearnerContext } from './learner-context'
import { buildEnglishAssistantInstructions } from './instructions'

const RESPONSES_URL = 'https://api.openai.com/v1/responses'
export const ENGLISH_ASSISTANT_MODEL = 'gpt-5.4-nano'

type ResponsesApiPayload = {
  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

type OpenAiStreamEvent = {
  type?: string
  delta?: string
}

export type StreamDeltaCallback = (accumulatedText: string, delta: string) => void

function getOpenAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not configured')
  return key
}

function extractOutputText(payload: ResponsesApiPayload): string {
  return payload.output
    ?.filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text')
    .map((item) => item.text ?? '')
    .join('')
    .trim() ?? ''
}

function buildRequestBody(
  messages: AssistantMessage[],
  activityContext?: ActivityContext | null,
  learnerContext?: EnglishAssistantLearnerContext | null,
  stream = false,
) {
  return {
    model: ENGLISH_ASSISTANT_MODEL,
    instructions: buildEnglishAssistantInstructions(activityContext, learnerContext),
    input: messages,
    ...(stream ? { stream: true } : {}),
  }
}

export function parseOpenAiSseDataLine(payload: string): OpenAiStreamEvent | null {
  if (!payload || payload === '[DONE]') return null
  try {
    return JSON.parse(payload) as OpenAiStreamEvent
  } catch {
    return null
  }
}

export async function streamEnglishAssistant(
  messages: AssistantMessage[],
  activityContext: ActivityContext | null | undefined,
  learnerContext: EnglishAssistantLearnerContext | null | undefined,
  onDelta: StreamDeltaCallback,
): Promise<string> {
  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(buildRequestBody(messages, activityContext, learnerContext, true)),
  })

  if (!response.ok) {
    console.error('OpenAI English assistant request failed', { status: response.status })
    throw new Error('OpenAI English assistant request failed')
  }

  if (!response.body) {
    throw new Error('OpenAI English assistant stream unavailable')
  }

  let accumulated = ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const event = parseOpenAiSseDataLine(line.slice(6).trim())
      if (event?.type === 'response.output_text.delta' && event.delta) {
        accumulated += event.delta
        onDelta(accumulated, event.delta)
      }
    }
  }

  const answer = accumulated.trim()
  if (!answer) throw new Error('OpenAI returned an empty assistant response')
  return answer
}

export async function askEnglishAssistant(
  messages: AssistantMessage[],
  activityContext?: ActivityContext | null,
  learnerContext?: EnglishAssistantLearnerContext | null,
): Promise<string> {
  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildRequestBody(messages, activityContext, learnerContext)),
  })

  if (!response.ok) {
    console.error('OpenAI English assistant request failed', { status: response.status })
    throw new Error('OpenAI English assistant request failed')
  }

  const answer = extractOutputText((await response.json()) as ResponsesApiPayload)
  if (!answer) throw new Error('OpenAI returned an empty assistant response')
  return answer
}
