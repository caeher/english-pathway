import { z } from 'zod'

const safeIdentifier = z.string().min(1).max(160)

export const showActivityActionSchema = z.object({
  activityId: safeIdentifier,
})

export const showGrammarActionSchema = z.object({
  markdown: z.string().min(1).max(12000).refine((value) => !/<script|javascript:|data:text\/html/i.test(value), 'Unsafe grammar content'),
  title: z.string().max(160).optional(),
})

export const showQuestionActionSchema = z.object({
  prompt: z.string().min(1).max(1000),
  options: z.array(z.string().min(1).max(300)).max(8).optional(),
  correctIndex: z.number().int().min(0).max(7).optional(),
})

export const curriculumContextActionSchema = z.object({
  query: z.string().trim().min(1).max(500),
  moduleId: z.string().min(1).max(100).optional(),
  chapterId: z.string().min(1).max(100).optional(),
})

export const tutorSessionStateSchema = z.enum([
  'preparing',
  'context',
  'explaining',
  'activity_presented',
  'waiting_response',
  'evaluating',
  'help',
  'reinforcing',
  'next_step',
  'closed',
])
