import { z } from 'zod'
import {
  audioPracticeModeSchema,
  contrastPairSchema,
  curatedAudioSchema,
  isValidCuratedAudioSrc,
} from './audio-schema'

const quizQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('multiple-choice'),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correct: z.number().int().min(0),
    explanation: z.string().optional(),
  }).superRefine((question, ctx) => {
    if (question.correct >= question.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `correct index ${question.correct} is out of range for ${question.options.length} options`,
        path: ['correct'],
      })
    }
    const uniqueOptions = new Set(question.options.map((o) => o.trim().toLowerCase()))
    if (uniqueOptions.size !== question.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'options must not contain duplicates',
        path: ['options'],
      })
    }
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
      audio: curatedAudioSchema.optional(),
      mode: audioPracticeModeSchema.optional(),
      question: z.string().min(1),
      options: z.array(z.string().min(1)).min(2),
      correct: z.number().int().min(0),
      explanation: z.string().optional(),
    }).superRefine((item, ctx) => {
      if (item.audio && !isValidCuratedAudioSrc(item.audio.src)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'audio.src must start with /audio/ or http(s)://',
          path: ['audio', 'src'],
        })
      }
    })).min(1),
  }),
  dictation: z.object({
    items: z.array(z.object({
      id: z.string().min(1),
      audioText: z.string().min(1),
      audio: curatedAudioSchema.optional(),
      hint: z.string().optional(),
    }).superRefine((item, ctx) => {
      if (item.audio && !isValidCuratedAudioSrc(item.audio.src)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'audio.src must start with /audio/ or http(s)://',
          path: ['audio', 'src'],
        })
      }
    })).min(1),
  }),
  pronunciation: z.object({
    items: z.array(z.object({
      id: z.string().min(1),
      phrase: z.string().min(1),
      audio: curatedAudioSchema.optional(),
      contrastPair: contrastPairSchema.optional(),
      hint: z.string().optional(),
    }).superRefine((item, ctx) => {
      if (item.audio && !isValidCuratedAudioSrc(item.audio.src)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'audio.src must start with /audio/ or http(s)://',
          path: ['audio', 'src'],
        })
      }
    })).min(1),
  }),
  'minimal-pairs': z.object({
    pairs: z.array(contrastPairSchema.extend({
      id: z.string().min(1),
      meaningA: z.string().min(1).optional(),
      meaningB: z.string().min(1).optional(),
      audioA: curatedAudioSchema.optional(),
      audioB: curatedAudioSchema.optional(),
      maxReplays: z.number().int().min(1).max(5).optional(),
    }).superRefine((pair, ctx) => {
      if (pair.wordA.trim().toLowerCase() === pair.wordB.trim().toLowerCase()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'wordA and wordB must be different',
          path: ['wordB'],
        })
      }
      if (!pair.meaningA?.trim() && !pair.meaningB?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'at least one of meaningA or meaningB is required',
          path: ['meaningA'],
        })
      }
      for (const [field, audio] of [['audioA', pair.audioA], ['audioB', pair.audioB]] as const) {
        if (audio && !isValidCuratedAudioSrc(audio.src)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'audio.src must start with /audio/ or http(s)://',
            path: [field, 'src'],
          })
        }
      }
    })).min(2),
  }),
  'branching-dialogue': z.object({
    setting: z.string().min(1),
    characters: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      role: z.string().optional(),
    })).optional(),
    startNodeId: z.string().min(1),
    nodes: z.array(z.object({
      id: z.string().min(1),
      speakerId: z.string().optional(),
      intention: z.string().min(1),
      prompt: z.string().min(1),
      audio: curatedAudioSchema.optional(),
      choices: z.array(z.object({
        id: z.string().min(1),
        text: z.string().min(1),
        nextNodeId: z.string().min(1),
        pragmaticRating: z.enum(['optimal', 'acceptable', 'inappropriate']),
        grammaticalRating: z.enum(['correct', 'incorrect']).optional(),
        consequence: z.string().optional(),
        explanation: z.string().min(1),
      })).max(4),
      isTerminal: z.boolean().optional(),
    }).superRefine((node, ctx) => {
      if (node.audio && !isValidCuratedAudioSrc(node.audio.src)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'audio.src must start with /audio/ or http(s)://',
          path: ['audio', 'src'],
        })
      }
      if (!node.isTerminal && (node.choices.length < 2 || node.choices.length > 4)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'non-terminal nodes must have 2–4 choices',
          path: ['choices'],
        })
      }
      if (node.isTerminal && node.choices.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'terminal nodes must not include choices',
          path: ['choices'],
        })
      }
    })).min(2).max(8),
  }).superRefine((props, ctx) => {
    const nodeIds = new Set(props.nodes.map((node) => node.id))
    if (!nodeIds.has(props.startNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startNodeId must reference an existing node',
        path: ['startNodeId'],
      })
    }

    props.nodes.forEach((node, nodeIndex) => {
      node.choices.forEach((choice, choiceIndex) => {
        if (!nodeIds.has(choice.nextNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `nextNodeId "${choice.nextNodeId}" does not exist`,
            path: ['nodes', nodeIndex, 'choices', choiceIndex, 'nextNodeId'],
          })
        }
      })
    })
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
  activityBase.extend({ type: z.literal('branching-dialogue'), props: activityPropsSchemas['branching-dialogue'] }),
  activityBase.extend({ type: z.literal('minimal-pairs'), props: activityPropsSchemas['minimal-pairs'] }),
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
