import { z } from 'zod'

const quizQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('multiple-choice'),
    question: z.string(),
    options: z.array(z.string()).min(2),
    correct: z.number().int().min(0),
    explanation: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('fill-blank'),
    question: z.string(),
    correct: z.string(),
    explanation: z.string().optional(),
  }),
])

export const activityPropsSchemas = {
  quiz: z.object({ questions: z.array(quizQuestionSchema).min(1) }),
  flashcard: z.object({
    cards: z.array(
      z.object({
        id: z.string(),
        front: z.string(),
        back: z.string(),
        example: z.string().optional(),
      })
    ).min(1),
  }),
  'word-match': z.object({
    pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2),
  }),
  'sentence-builder': z.object({
    sentences: z.array(
      z.object({
        prompt: z.string().optional(),
        words: z.array(z.string()).min(2),
        correct: z.string(),
      })
    ).min(1),
  }),
  'svg-scene': z.object({
    scene: z.object({
      viewBox: z.string(),
      bg: z.string().optional(),
      items: z.array(z.record(z.string(), z.unknown())).min(1),
    }),
  }),
  'word-scramble': z.object({
    words: z.array(
      z.object({
        word: z.string(),
        hint: z.string(),
        category: z.string().optional(),
      })
    ).min(1),
  }),
  listening: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        audioText: z.string(),
        question: z.string(),
        options: z.array(z.string()).min(2),
        correct: z.number().int().min(0),
        explanation: z.string().optional(),
      })
    ).min(1),
  }),
  dictation: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        audioText: z.string(),
        hint: z.string().optional(),
      })
    ).min(1),
  }),
  pronunciation: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        phrase: z.string(),
        hint: z.string().optional(),
      })
    ).min(1),
  }),
  'drag-drop': z.object({
    mode: z.enum(['match', 'sentence']).default('match'),
    pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
    sentences: z.array(
      z.object({
        prompt: z.string().optional(),
        words: z.array(z.string()).min(2),
        correct: z.string(),
      })
    ).optional(),
  }),
} as const

export type ActivityTypeKey = keyof typeof activityPropsSchemas

export const chapterActivitySchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'svg-scene',
    'flashcard',
    'word-match',
    'sentence-builder',
    'quiz',
    'word-scramble',
    'listening',
    'dictation',
    'pronunciation',
    'drag-drop',
  ]),
  title: z.string().min(1),
  description: z.string(),
  props: z.record(z.string(), z.unknown()),
})

export const chapterUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  xpReward: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
})

export function validateActivityProps(type: ActivityTypeKey, props: unknown) {
  const schema = activityPropsSchemas[type]
  return schema.safeParse(props)
}
