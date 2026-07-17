import type { ChapterActivity, Module, Chapter } from '@/types'
import type {
  DictationItem,
  FlashcardData,
  ListeningItem,
  MatchPair,
  PronunciationItem,
  QuizQuestion,
  SentenceChallenge,
  SVGScene,
  WordScrambleItem,
} from '@/types'
import { validateActivityProps, type ActivityTypeKey } from '@/lib/content/schemas'
import { loadAllModules } from '@/lib/knowledge/load-all'
import type { ReviewContent, ReviewSourceItem } from './types'

function source(activity: ChapterActivity, chapter: Chapter, module: Module, unit: string, prompt: string, answer: string, hint?: string): ReviewSourceItem {
  const content: ReviewContent = {
    activityId: activity.id,
    activityTitle: activity.title,
    activityType: activity.type,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    moduleId: module.id,
    moduleTitle: module.title,
    prompt,
    answer,
    ...(hint ? { hint } : {}),
  }

  return { contentRef: `${activity.id}:${unit}`, content }
}

export function extractReviewItems(activity: ChapterActivity, chapter: Chapter, module: Module): ReviewSourceItem[] {
  const parsed = validateActivityProps(activity.type as ActivityTypeKey, activity.props)
  if (!parsed.success) return []
  const props = parsed.data

  switch (activity.type) {
    case 'quiz':
      return (props as unknown as { questions: QuizQuestion[] }).questions.map((question) => source(
        activity, chapter, module, `quiz:${question.id}`, question.question,
        question.type === 'multiple-choice' ? question.options[question.correct] : question.correct,
        question.explanation
      ))
    case 'flashcard':
      return (props as unknown as { cards: FlashcardData[] }).cards.map((card) => source(activity, chapter, module, `flashcard:${card.id}`, card.front, card.back, card.example))
    case 'word-match':
      return (props as unknown as { pairs: MatchPair[] }).pairs.map((pair, index) => source(activity, chapter, module, `match:${index}`, pair.left, pair.right))
    case 'sentence-builder':
      return (props as unknown as { sentences: SentenceChallenge[] }).sentences.map((sentence, index) => source(activity, chapter, module, `sentence:${index}`, sentence.prompt ?? sentence.words.join(' '), sentence.correct))
    case 'word-scramble':
      return (props as unknown as { words: WordScrambleItem[] }).words.map((word, index) => source(activity, chapter, module, `scramble:${index}`, word.hint, word.word, word.category))
    case 'listening':
      return (props as unknown as { items: ListeningItem[] }).items.map((item) => source(activity, chapter, module, `listening:${item.id}`, item.question, item.options[item.correct], item.explanation))
    case 'dictation':
      return (props as unknown as { items: DictationItem[] }).items.map((item) => source(activity, chapter, module, `dictation:${item.id}`, item.hint ?? 'Write what you hear', item.audioText))
    case 'pronunciation':
      return (props as unknown as { items: PronunciationItem[] }).items.map((item) => source(activity, chapter, module, `pronunciation:${item.id}`, item.hint ?? 'Say this phrase', item.phrase))
    case 'drag-drop':
      return (props as unknown as { mode: 'match' | 'sentence'; pairs?: MatchPair[]; sentences?: SentenceChallenge[] }).mode === 'sentence'
        ? ((props as unknown as { sentences?: SentenceChallenge[] }).sentences ?? []).map((sentence, index) => source(activity, chapter, module, `drag-sentence:${index}`, sentence.prompt ?? sentence.words.join(' '), sentence.correct))
        : ((props as unknown as { pairs?: MatchPair[] }).pairs ?? []).map((pair, index) => source(activity, chapter, module, `drag-match:${index}`, pair.left, pair.right))
    case 'svg-scene':
      return (props as unknown as { scene: SVGScene }).scene.items.map((item, index) => {
        const label = typeof item.label === 'string' ? item.label : `Scene item ${index + 1}`
        const labelEn = typeof item.labelEn === 'string' ? item.labelEn : label
        const id = typeof item.id === 'string' ? item.id : String(index)
        return source(activity, chapter, module, `scene:${id}`, label, labelEn)
      })
  }
}

export function findReviewItem(contentRef: string): ReviewSourceItem | null {
  for (const curriculumModule of loadAllModules()) {
    for (const chapter of curriculumModule.chapters) {
      for (const activity of chapter.activities) {
        const item = extractReviewItems(activity, chapter, curriculumModule).find((candidate) => candidate.contentRef === contentRef)
        if (item) return item
      }
    }
  }
  return null
}
