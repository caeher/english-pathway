import type { ActivityTypeKey } from './contracts'

export type GraduatedHintLevel = 1 | 2 | 3

export type HintSource = 'editorial' | 'tutor'

export interface ResolvedHint {
  level: GraduatedHintLevel
  label: string
  body: string
  source: HintSource
  revealsAnswer: boolean
}

export interface TutorHintContext {
  activityId: string
  activityType: ActivityTypeKey
  activityTitle: string
  itemIndex: number
  level: GraduatedHintLevel
  maxLevel: GraduatedHintLevel
}

export const MAX_GRADUATED_HINT_LEVEL = 3 as const

const HINT_LABELS: Record<GraduatedHintLevel, string> = {
  1: 'Reminder',
  2: 'Partial hint',
  3: 'Explanation',
}

function clampLevel(level: number): GraduatedHintLevel {
  if (level <= 1) return 1
  if (level >= 3) return 3
  return 2
}

function partialWords(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const slice = words.slice(0, Math.min(wordCount, Math.max(1, words.length - 1)))
  return slice.join(' ')
}

function firstSyllableBreak(phrase: string): string {
  const words = phrase.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) {
    const word = words[0]
    const midpoint = Math.max(1, Math.ceil(word.length / 2))
    return `${word.slice(0, midpoint)}…`
  }
  return words[0]
}

function resolveWordScrambleHint(
  props: { words: Array<{ word: string; hint: string; category?: string }> },
  itemIndex: number,
  level: GraduatedHintLevel,
): ResolvedHint | null {
  const item = props.words[itemIndex]
  if (!item) return null

  const label = HINT_LABELS[level]
  if (level === 1) {
    const reminder = item.hint || item.category || 'Unscramble the letters to form an English word.'
    return { level, label, body: reminder, source: 'editorial', revealsAnswer: false }
  }
  if (level === 2) {
    const firstLetter = item.word.charAt(0).toUpperCase()
    return {
      level,
      label,
      body: `The word starts with "${firstLetter}" and has ${item.word.length} letters.`,
      source: 'editorial',
      revealsAnswer: false,
    }
  }
  return {
    level,
    label,
    body: `The answer is "${item.word}".`,
    source: 'editorial',
    revealsAnswer: true,
  }
}

function resolveDictationHint(
  props: { items: Array<{ audioText: string; hint?: string }> },
  itemIndex: number,
  level: GraduatedHintLevel,
): ResolvedHint | null {
  const item = props.items[itemIndex]
  if (!item) return null

  const label = HINT_LABELS[level]
  if (level === 1) {
    const reminder = item.hint || 'Listen carefully and type what you hear.'
    return { level, label, body: reminder, source: 'editorial', revealsAnswer: false }
  }
  if (level === 2) {
    const partial = partialWords(item.audioText, 2)
    return {
      level,
      label,
      body: partial ? `The phrase begins: "${partial}…"` : 'Focus on the stressed words in the audio.',
      source: 'editorial',
      revealsAnswer: false,
    }
  }
  return {
    level,
    label,
    body: `The full phrase is: "${item.audioText}"`,
    source: 'editorial',
    revealsAnswer: true,
  }
}

function resolvePronunciationHint(
  props: { items: Array<{ phrase: string; hint?: string }> },
  itemIndex: number,
  level: GraduatedHintLevel,
): ResolvedHint | null {
  const item = props.items[itemIndex]
  if (!item) return null

  const label = HINT_LABELS[level]
  if (level === 1) {
    const reminder = item.hint || 'Repeat the phrase clearly into your microphone.'
    return { level, label, body: reminder, source: 'editorial', revealsAnswer: false }
  }
  if (level === 2) {
    const partial = firstSyllableBreak(item.phrase)
    return {
      level,
      label,
      body: partial ? `Start with: "${partial}"` : 'Break the phrase into smaller chunks.',
      source: 'editorial',
      revealsAnswer: false,
    }
  }
  return {
    level,
    label,
    body: `Say this phrase: "${item.phrase}"`,
    source: 'editorial',
    revealsAnswer: true,
  }
}

export function resolveEditorialHint(
  activityType: ActivityTypeKey,
  props: unknown,
  itemIndex: number,
  level: number,
): ResolvedHint | null {
  const hintLevel = clampLevel(level)
  if (!props || typeof props !== 'object') return null

  switch (activityType) {
    case 'word-scramble':
      return resolveWordScrambleHint(props as { words: Array<{ word: string; hint: string; category?: string }> }, itemIndex, hintLevel)
    case 'dictation':
      return resolveDictationHint(props as { items: Array<{ audioText: string; hint?: string }> }, itemIndex, hintLevel)
    case 'pronunciation':
      return resolvePronunciationHint(props as { items: Array<{ phrase: string; hint?: string }> }, itemIndex, hintLevel)
    default:
      return null
  }
}

export function buildTutorHintRequest(context: TutorHintContext): string {
  const itemLabel = context.itemIndex >= 0 ? `item ${context.itemIndex + 1}` : 'the current item'
  return [
    `I need a graduated hint (level ${context.level} of ${context.maxLevel}) for ${itemLabel} in activity "${context.activityTitle}" (${context.activityType}, id ${context.activityId}).`,
    'Give a useful hint without revealing the full answer unless this is the final explanation level.',
    'Keep the response short and encouraging.',
  ].join(' ')
}

export function getHintLabel(level: GraduatedHintLevel): string {
  return HINT_LABELS[level]
}
