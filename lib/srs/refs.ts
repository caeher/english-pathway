import { validateActivityProps, type ActivityTypeKey } from '@/lib/content/schemas'
import type { ChapterActivity } from '@/types'

export function getReviewContentRefs(activity: ChapterActivity, weakItemIndexes?: number[]): string[] {
  const parsed = validateActivityProps(activity.type as ActivityTypeKey, activity.props)
  if (!parsed.success) return []
  const props = parsed.data

  const pickWeak = (refs: string[]) => weakItemIndexes ? refs.filter((_, index) => weakItemIndexes.includes(index)) : refs

  switch (activity.type) {
    case 'quiz': return pickWeak((props as unknown as { questions: { id: string }[] }).questions.map((item) => `${activity.id}:quiz:${item.id}`))
    case 'flashcard': return pickWeak((props as unknown as { cards: { id: string }[] }).cards.map((item) => `${activity.id}:flashcard:${item.id}`))
    case 'word-match': return pickWeak((props as unknown as { pairs: unknown[] }).pairs.map((_, index) => `${activity.id}:match:${index}`))
    case 'sentence-builder': return pickWeak((props as unknown as { sentences: unknown[] }).sentences.map((_, index) => `${activity.id}:sentence:${index}`))
    case 'word-scramble': return pickWeak((props as unknown as { words: unknown[] }).words.map((_, index) => `${activity.id}:scramble:${index}`))
    case 'listening': return pickWeak((props as unknown as { items: { id: string }[] }).items.map((item) => `${activity.id}:listening:${item.id}`))
    case 'dictation': return pickWeak((props as unknown as { items: { id: string }[] }).items.map((item) => `${activity.id}:dictation:${item.id}`))
    case 'pronunciation': return pickWeak((props as unknown as { items: { id: string }[] }).items.map((item) => `${activity.id}:pronunciation:${item.id}`))
    case 'drag-drop': return (props as unknown as { mode: 'match' | 'sentence'; pairs?: unknown[]; sentences?: unknown[] }).mode === 'sentence'
      ? pickWeak(((props as unknown as { sentences?: unknown[] }).sentences ?? []).map((_, index) => `${activity.id}:drag-sentence:${index}`))
      : pickWeak(((props as unknown as { pairs?: unknown[] }).pairs ?? []).map((_, index) => `${activity.id}:drag-match:${index}`))
    case 'svg-scene': return pickWeak((props as unknown as { scene: { items: { id?: string }[] } }).scene.items.map((item, index) => `${activity.id}:scene:${typeof item.id === 'string' ? item.id : index}`))
  }
}
