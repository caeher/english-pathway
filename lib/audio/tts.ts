'use client'

const ENGLISH_LOCALES = ['en-US', 'en-GB', 'en']

let preferredVoice: SpeechSynthesisVoice | null = null
let activeText = ''
const listeners = new Set<(text: string) => void>()

function emitState() {
  for (const listener of listeners) listener(activeText)
}

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  for (const locale of ENGLISH_LOCALES) {
    const match = voices.find((v) => v.lang.startsWith(locale))
    if (match) return match
  }
  return voices.find((v) => v.lang.startsWith('en')) ?? null
}

export function getTtsSupported(): boolean {
  return isSupported()
}

export function stopSpeaking(): void {
  if (!isSupported()) return
  window.speechSynthesis.cancel()
  activeText = ''
  emitState()
}

export function subscribeToTtsState(listener: (text: string) => void): () => void {
  listeners.add(listener)
  listener(activeText)
  return () => listeners.delete(listener)
}

export function speak(
  text: string,
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
): boolean {
  if (!isSupported() || !text.trim()) return false

  stopSpeaking()

  const utterance = new SpeechSynthesisUtterance(text.trim())
  utterance.lang = 'en-US'
  utterance.rate = options?.rate ?? 0.9
  utterance.pitch = options?.pitch ?? 1

  if (!preferredVoice) {
    preferredVoice = pickEnglishVoice()
  }
  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  activeText = text.trim()
  utterance.onend = () => {
    if (activeText === text.trim()) {
      activeText = ''
      emitState()
    }
    options?.onEnd?.()
  }
  utterance.onerror = utterance.onend

  window.speechSynthesis.speak(utterance)
  emitState()
  return true
}

if (typeof window !== 'undefined' && isSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    preferredVoice = pickEnglishVoice()
  }
}
