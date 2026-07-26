import type { UsageCredits } from '@/lib/english-assistant/constants'

export type AssistantStreamDeltaEvent = {
  event: 'delta'
  data: { text: string }
}

export type AssistantStreamDoneEvent = {
  event: 'done'
  data: { conversationId: string; credits: UsageCredits }
}

export type AssistantStreamErrorEvent = {
  event: 'error'
  data: { code?: string; error: string }
}

export type AssistantStreamEvent =
  | AssistantStreamDeltaEvent
  | AssistantStreamDoneEvent
  | AssistantStreamErrorEvent

export function encodeAssistantStreamEvent(event: AssistantStreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`
}

function parseSseBlock(block: string): AssistantStreamEvent | null {
  let eventName: AssistantStreamEvent['event'] | null = null
  let dataLine: string | null = null

  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) {
      eventName = line.slice(7).trim() as AssistantStreamEvent['event']
    } else if (line.startsWith('data: ')) {
      dataLine = line.slice(6)
    }
  }

  if (!eventName || !dataLine) return null

  try {
    const data = JSON.parse(dataLine) as AssistantStreamEvent['data']
    if (eventName === 'delta') return { event: 'delta', data: data as AssistantStreamDeltaEvent['data'] }
    if (eventName === 'done') return { event: 'done', data: data as AssistantStreamDoneEvent['data'] }
    if (eventName === 'error') return { event: 'error', data: data as AssistantStreamErrorEvent['data'] }
  } catch {
    return null
  }

  return null
}

export function createAssistantStreamParser() {
  let buffer = ''

  return {
    push(chunk: string): AssistantStreamEvent[] {
      buffer += chunk
      const events: AssistantStreamEvent[] = []

      while (true) {
        const boundary = buffer.indexOf('\n\n')
        if (boundary === -1) break

        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const parsed = parseSseBlock(block)
        if (parsed) events.push(parsed)
      }

      return events
    },
  }
}
