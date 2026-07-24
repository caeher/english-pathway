import { z } from 'zod'
import {
  isSafePanelText,
  panelContentSchema,
  PANEL_CONTENT_LIMITS,
} from '@/lib/tutor/panel-content'

const safeIdentifier = z.string().min(1).max(160)

const safePanelTextField = (maxLength: number) =>
  z
    .string()
    .min(1)
    .max(maxLength)
    .refine((value) => isSafePanelText(value), 'Unsafe panel text')

export const showActivityActionSchema = z.object({
  activityId: safeIdentifier,
})

export const showGrammarActionSchema = z.object({
  title: z
    .string()
    .max(PANEL_CONTENT_LIMITS.maxTitleChars)
    .refine((value) => value.length === 0 || isSafePanelText(value), 'Unsafe panel title')
    .optional(),
  blocks: panelContentSchema,
})

export const showQuestionActionSchema = z.object({
  prompt: safePanelTextField(1000),
  options: z.array(safePanelTextField(300)).max(8).optional(),
  correctIndex: z.number().int().min(0).max(7).optional(),
})

export const curriculumContextActionSchema = z.object({
  query: z.string().trim().min(1).max(500),
  moduleId: z.string().min(1).max(100).optional(),
  chapterId: z.string().min(1).max(100).optional(),
})

export const listChapterActivitiesActionSchema = z.object({
  chapterId: safeIdentifier,
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
