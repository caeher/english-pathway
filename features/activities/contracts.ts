import { z } from 'zod'

const quizQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('multiple-choice'),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correct: z.number().int().min(0),
    explanation: z.string().optional(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('fill-blank'),
    question: z.string().min(1),
    // An empty answer is valid for zero-article fill-in-the-blank prompts.
    correct: z.string(),
    explanation: z.string().optional(),
  }),
])

const sentenceChallengeSchema = z.object({
  prompt: z.string().optional(),
  words: z.array(z.string().min(1)).min(2),
  correct: z.string().min(1),
})

const pairSchema = z.object({ left: z.string().min(1), right: z.string().min(1) })

export const activityPropsSchemas = {
  quiz: z.object({ questions: z.array(quizQuestionSchema).min(1) }),
  flashcard: z.object({
    cards: z.array(z.object({
      id: z.string().min(1),
      front: z.string().min(1),
      back: z.string().min(1),
      example: z.string().optional(),
    })).min(1),
  }),
  'word-match': z.object({ pairs: z.array(pairSchema).min(2) }),
  'sentence-builder': z.object({ sentences: z.array(sentenceChallengeSchema).min(1) }),
  'word-scramble': z.object({
    words: z.array(z.object({ word: z.string().min(1), hint: z.string().min(1), category: z.string().optional() })).min(1),
  }),
  listening: z.object({
    items: z.array(z.object({
      id: z.string().min(1),
      audioText: z.string().min(1),
      question: z.string().min(1),
      options: z.array(z.string().min(1)).min(2),
      correct: z.number().int().min(0),
      explanation: z.string().optional(),
    })).min(1),
  }),
  dictation: z.object({
    items: z.array(z.object({ id: z.string().min(1), audioText: z.string().min(1), hint: z.string().optional() })).min(1),
  }),
  pronunciation: z.object({
    items: z.array(z.object({ id: z.string().min(1), phrase: z.string().min(1), hint: z.string().optional() })).min(1),
  }),
} as const

export type ActivityTypeKey = keyof typeof activityPropsSchemas
export type ActivityProps = {
  [K in ActivityTypeKey]: { type: K; props: z.infer<(typeof activityPropsSchemas)[K]> }
}[ActivityTypeKey]

const activityBase = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
})

export const chapterActivitySchema = z.discriminatedUnion('type', [
  activityBase.extend({ type: z.literal('quiz'), props: activityPropsSchemas.quiz }),
  activityBase.extend({ type: z.literal('flashcard'), props: activityPropsSchemas.flashcard }),
  activityBase.extend({ type: z.literal('word-match'), props: activityPropsSchemas['word-match'] }),
  activityBase.extend({ type: z.literal('sentence-builder'), props: activityPropsSchemas['sentence-builder'] }),
  activityBase.extend({ type: z.literal('word-scramble'), props: activityPropsSchemas['word-scramble'] }),
  activityBase.extend({ type: z.literal('listening'), props: activityPropsSchemas.listening }),
  activityBase.extend({ type: z.literal('dictation'), props: activityPropsSchemas.dictation }),
  activityBase.extend({ type: z.literal('pronunciation'), props: activityPropsSchemas.pronunciation }),
])

export type ChapterActivityInput = z.infer<typeof chapterActivitySchema>

export const chapterUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  xpReward: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
})

export function validateActivityProps(type: ActivityTypeKey, props: unknown) {
  return activityPropsSchemas[type].safeParse(props)
}
