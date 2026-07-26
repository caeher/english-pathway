import { describe, expect, it } from 'vitest'
import { parseOpenAiSseDataLine } from '@/lib/english-assistant/openai'
import {
  createAssistantStreamParser,
  encodeAssistantStreamEvent,
} from '@/lib/english-assistant/stream-events'

describe('english assistant stream events', () => {
  it('encodes and parses delta, done, and error events', () => {
    const parser = createAssistantStreamParser()
    const chunk = [
      encodeAssistantStreamEvent({ event: 'delta', data: { text: 'Hello' } }),
      encodeAssistantStreamEvent({
        event: 'done',
        data: {
          conversationId: '11111111-1111-4111-8111-111111111111',
          credits: { assistantMessagesRemaining: 42 },
        },
      }),
    ].join('')

    const events = parser.push(chunk)
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ event: 'delta', data: { text: 'Hello' } })
    expect(events[1]).toMatchObject({
      event: 'done',
      data: {
        conversationId: '11111111-1111-4111-8111-111111111111',
        credits: { assistantMessagesRemaining: 42 },
      },
    })
  })

  it('buffers partial SSE blocks across chunks', () => {
    const parser = createAssistantStreamParser()
    const first = parser.push('event: delta\nda')
    const second = parser.push('ta: {"text":"Hi"}\n\n')
    expect(first).toHaveLength(0)
    expect(second).toHaveLength(1)
    expect(second[0]).toMatchObject({ event: 'delta', data: { text: 'Hi' } })
  })

  it('parses OpenAI output text delta events', () => {
    const event = parseOpenAiSseDataLine(JSON.stringify({
      type: 'response.output_text.delta',
      delta: 'practice',
    }))
    expect(event).toMatchObject({
      type: 'response.output_text.delta',
      delta: 'practice',
    })
  })
})
