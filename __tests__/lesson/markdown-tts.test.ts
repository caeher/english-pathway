import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('long lesson rendering and TTS lifecycle', () => {
  const markdown = readFileSync(resolve(process.cwd(), 'components/lesson/MarkdownWithTts.tsx'), 'utf8')
  const tts = readFileSync(resolve(process.cwd(), 'lib/audio/tts.ts'), 'utf8')

  it('memoizes the parsed markdown document and keeps media deferred', () => {
    expect(markdown).toContain('memo(function MarkdownDocument')
    expect(markdown).toContain('remarkPlugins={markdownPlugins}')
    expect(markdown).toContain('loading="lazy"')
  })

  it('stops speech when lesson content changes and synchronizes every speak control', () => {
    expect(markdown).toContain('useEffect(() => () => stopSpeaking(), [content])')
    expect(tts).toContain('subscribeToTtsState')
    expect(tts).toContain('window.speechSynthesis.cancel()')
    expect(tts).toContain('utterance.onerror = utterance.onend')
  })
})
