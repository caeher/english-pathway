import type { ActivityTypeKey } from './contracts'

export interface RoundBounds {
  min: number
  target: number
  max: number
}

export const ACTIVITY_ROUND_BOUNDS: Record<ActivityTypeKey, RoundBounds> = {
  flashcard: { min: 3, target: 4, max: 5 },
  'word-match': { min: 4, target: 5, max: 6 },
  quiz: { min: 3, target: 4, max: 5 },
  'sentence-builder': { min: 3, target: 4, max: 5 },
  'word-scramble': { min: 3, target: 4, max: 5 },
  listening: { min: 3, target: 3, max: 5 },
  dictation: { min: 3, target: 3, max: 5 },
  pronunciation: { min: 3, target: 3, max: 5 },
  'minimal-pairs': { min: 2, target: 3, max: 5 },
  'branching-dialogue': { min: 1, target: 1, max: 1 },
}

export interface SliceRoundOptions {
  roundIndex?: number
  offset?: number
  limit?: number
  prioritizeItemIndexes?: number[]
}

export interface ActivityRoundMetadata {
  currentRound: number
  totalRounds: number
  totalItems: number
  itemOffset: number
  roundItemCount: number
}

export function getRoundBounds(type: ActivityTypeKey): RoundBounds {
  return ACTIVITY_ROUND_BOUNDS[type] ?? { min: 3, target: 4, max: 5 }
}

function sliceArray<T>(
  items: T[],
  bounds: RoundBounds,
  options?: SliceRoundOptions,
): { sliced: T[]; meta: ActivityRoundMetadata } {
  const totalItems = items.length
  if (totalItems === 0) {
    return {
      sliced: [],
      meta: { currentRound: 0, totalRounds: 0, totalItems: 0, itemOffset: 0, roundItemCount: 0 },
    }
  }

  // If item count is within [min, max], keep entire array as single round
  if (totalItems <= bounds.max) {
    return {
      sliced: [...items],
      meta: {
        currentRound: 0,
        totalRounds: 1,
        totalItems,
        itemOffset: 0,
        roundItemCount: totalItems,
      },
    }
  }

  const batchSize = Math.max(bounds.min, Math.min(bounds.max, options?.limit ?? bounds.target))
  const totalRounds = Math.ceil(totalItems / batchSize)

  // Prioritize weak items if specified (e.g. during reinforcement rounds)
  if (options?.prioritizeItemIndexes && options.prioritizeItemIndexes.length > 0) {
    const weakSet = new Set(options.prioritizeItemIndexes)
    const prioritized: T[] = []
    const remaining: T[] = []

    items.forEach((item, index) => {
      if (weakSet.has(index)) {
        prioritized.push(item)
      } else {
        remaining.push(item)
      }
    })

    const combined = [...prioritized, ...remaining]
    const sliced = combined.slice(0, batchSize)
    return {
      sliced,
      meta: {
        currentRound: options.roundIndex ?? 0,
        totalRounds,
        totalItems,
        itemOffset: 0,
        roundItemCount: sliced.length,
      },
    }
  }

  const roundIndex = Math.max(0, options?.roundIndex ?? 0)
  const explicitOffset = options?.offset
  const itemOffset = explicitOffset !== undefined ? explicitOffset : (roundIndex % totalRounds) * batchSize

  let sliced = items.slice(itemOffset, itemOffset + batchSize)
  // Ensure we meet minimum if we are near the end and items remain earlier
  if (sliced.length < bounds.min && totalItems >= bounds.min) {
    const needed = bounds.min - sliced.length
    const prefix = items.slice(Math.max(0, itemOffset - needed), itemOffset)
    sliced = [...prefix, ...sliced]
  }

  return {
    sliced,
    meta: {
      currentRound: roundIndex,
      totalRounds,
      totalItems,
      itemOffset,
      roundItemCount: sliced.length,
    },
  }
}

export function countActivityItems(type: ActivityTypeKey, props: unknown): number {
  if (!props || typeof props !== 'object') return 0
  const raw = props as Record<string, unknown>

  switch (type) {
    case 'quiz':
      return Array.isArray(raw.questions) ? raw.questions.length : 0
    case 'flashcard':
      return Array.isArray(raw.cards) ? raw.cards.length : 0
    case 'word-match':
      return Array.isArray(raw.pairs) ? raw.pairs.length : 0
    case 'sentence-builder':
      return Array.isArray(raw.sentences) ? raw.sentences.length : 0
    case 'word-scramble':
      return Array.isArray(raw.words) ? raw.words.length : 0
    case 'listening':
    case 'dictation':
    case 'pronunciation':
      return Array.isArray(raw.items) ? raw.items.length : 0
    case 'minimal-pairs':
      return Array.isArray(raw.pairs) ? raw.pairs.length : 0
    case 'branching-dialogue':
      return Array.isArray(raw.nodes) ? 1 : 0
    default:
      return 0
  }
}

export function sliceActivityPropsToRound(
  type: ActivityTypeKey,
  props: unknown,
  options?: SliceRoundOptions,
): { props: Record<string, unknown>; roundMeta: ActivityRoundMetadata } {
  if (!props || typeof props !== 'object') {
    return {
      props: {},
      roundMeta: { currentRound: 0, totalRounds: 0, totalItems: 0, itemOffset: 0, roundItemCount: 0 },
    }
  }

  const bounds = getRoundBounds(type)
  const raw = props as Record<string, unknown>

  switch (type) {
    case 'flashcard': {
      const cards = Array.isArray(raw.cards) ? raw.cards : []
      const { sliced, meta } = sliceArray(cards, bounds, options)
      return { props: { ...raw, cards: sliced }, roundMeta: meta }
    }
    case 'word-match': {
      const pairs = Array.isArray(raw.pairs) ? raw.pairs : []
      const { sliced, meta } = sliceArray(pairs, bounds, options)
      return { props: { ...raw, pairs: sliced }, roundMeta: meta }
    }
    case 'quiz': {
      const questions = Array.isArray(raw.questions) ? raw.questions : []
      const { sliced, meta } = sliceArray(questions, bounds, options)
      return { props: { ...raw, questions: sliced }, roundMeta: meta }
    }
    case 'sentence-builder': {
      const sentences = Array.isArray(raw.sentences) ? raw.sentences : []
      const { sliced, meta } = sliceArray(sentences, bounds, options)
      return { props: { ...raw, sentences: sliced }, roundMeta: meta }
    }
    case 'word-scramble': {
      const words = Array.isArray(raw.words) ? raw.words : []
      const { sliced, meta } = sliceArray(words, bounds, options)
      return { props: { ...raw, words: sliced }, roundMeta: meta }
    }
    case 'listening':
    case 'dictation':
    case 'pronunciation': {
      const items = Array.isArray(raw.items) ? raw.items : []
      const { sliced, meta } = sliceArray(items, bounds, options)
      return { props: { ...raw, items: sliced }, roundMeta: meta }
    }
    case 'minimal-pairs': {
      const pairs = Array.isArray(raw.pairs) ? raw.pairs : []
      const { sliced, meta } = sliceArray(pairs, bounds, options)
      return { props: { ...raw, pairs: sliced }, roundMeta: meta }
    }
    case 'branching-dialogue': {
      return {
        props: { ...raw },
        roundMeta: { currentRound: 0, totalRounds: 1, totalItems: 1, itemOffset: 0, roundItemCount: 1 },
      }
    }
    default:
      return {
        props: { ...raw },
        roundMeta: { currentRound: 0, totalRounds: 1, totalItems: 1, itemOffset: 0, roundItemCount: 1 },
      }
  }
}
