import { describe, expect, it } from 'vitest'
import { ASSISTANT_MESSAGE_CREDITS, AUDIO_CREDIT_SECONDS } from '@/lib/credits/usage'

describe('included usage credits', () => {
  it('includes twenty minutes of audio and fifty assistant messages per account', () => {
    expect(AUDIO_CREDIT_SECONDS).toBe(1200)
    expect(ASSISTANT_MESSAGE_CREDITS).toBe(50)
  })
})
