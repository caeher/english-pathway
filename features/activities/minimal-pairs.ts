import type { MinimalPairItem } from '@/types'

export type PlayedVariant = 'A' | 'B'

export function pickPlayedVariant(): PlayedVariant {
  return Math.random() < 0.5 ? 'A' : 'B'
}

export function getPlayedWord(pair: MinimalPairItem, variant: PlayedVariant): string {
  return variant === 'A' ? pair.wordA : pair.wordB
}

export function isDiscriminationCorrect(selected: PlayedVariant, playedVariant: PlayedVariant): boolean {
  return selected === playedVariant
}

export function buildDiscriminationFeedback(
  pair: MinimalPairItem,
  playedVariant: PlayedVariant,
  correct: boolean,
): string {
  const heard = getPlayedWord(pair, playedVariant)
  if (correct) {
    return `Correct — you heard "${heard}". ${pair.tip}`
  }
  const other = playedVariant === 'A' ? pair.wordB : pair.wordA
  return `You heard "${heard}", not "${other}". ${pair.tip}`
}

export function getDefaultMaxReplays(pair: MinimalPairItem): number {
  return pair.maxReplays ?? 3
}
