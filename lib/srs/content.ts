import type { ChapterActivity, Module, Chapter } from '@/types'
import type {
  BranchingDialogueProps,
  DictationItem,
  FlashcardData,
  ListeningItem,
  MatchPair,
  PronunciationItem,
  QuizQuestion,
  SentenceChallenge,
  WordScrambleItem,
} from '@/types'
import { validateActivityProps, type ActivityTypeKey } from '@/lib/content/schemas'
import { getDecisionNodeIds } from '@/features/activities/branching-dialogue'
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

export function normalizeLegacyContentRef(contentRef: string): string {
  const dragMatch = contentRef.match(/^(.+)-dragdrop:drag-match:(\d+)$/)
  if (dragMatch) {
    const [, chapterPrefix, index] = dragMatch
    return `${chapterPrefix}-match:match:${index}`
  }

  const dragSentence = contentRef.match(/^(.+)-dragdrop:drag-sentence:(\d+)$/)
  if (dragSentence) {
    const [, chapterPrefix, index] = dragSentence
    return `${chapterPrefix}-sentence:sentence:${index}`
  }

  return contentRef
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
    case 'branching-dialogue': {
      const dialogueProps = props as unknown as BranchingDialogueProps
      return getDecisionNodeIds(dialogueProps).map((nodeId) => {
        const node = dialogueProps.nodes.find((candidate) => candidate.id === nodeId)
        const optimal = node?.choices.find((choice) => choice.pragmaticRating === 'optimal')
        return source(
          activity,
          chapter,
          module,
          `dialogue:${nodeId}`,
          node?.intention ?? 'Choose an appropriate response',
          optimal?.text ?? node?.choices[0]?.text ?? '',
          optimal?.explanation,
        )
      })
    }
  }
}

export function findReviewItem(contentRef: string): ReviewSourceItem | null {
  const normalizedRef = normalizeLegacyContentRef(contentRef)
  for (const curriculumModule of loadAllModules()) {
    for (const chapter of curriculumModule.chapters) {
      for (const activity of chapter.activities) {
        const item = extractReviewItems(activity, chapter, curriculumModule).find((candidate) => candidate.contentRef === normalizedRef)
        if (item) return item
      }
    }
  }
  return null
}
