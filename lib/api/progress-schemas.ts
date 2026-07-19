import { z } from 'zod'

const progressStatus = z.enum(['not_started', 'in_progress', 'completed'])

export const activityProgressSchema = z.object({
  activityId: z.string().min(1).max(160),
  status: progressStatus,
  score: z.number().min(0).max(100).optional(),
  attempts: z.number().int().min(0).max(1000).optional(),
  activityType: z.string().max(50).optional(),
  chapterId: z.string().max(100).optional(),
  moduleId: z.string().max(100).optional(),
})

export const chapterProgressSchema = z.object({
  chapterId: z.string().min(1).max(100),
  status: progressStatus,
  moduleId: z.string().max(100).optional(),
})

export const lastActivitySchema = z.object({
  activityId: z.string().min(1).max(160),
  chapterId: z.string().min(1).max(100).optional(),
  moduleId: z.string().min(1).max(100).optional(),
})

export const mergeProgressSchema = z.object({
  activities: z.array(activityProgressSchema).max(500).default([]),
  chapters: z.array(chapterProgressSchema).max(500).default([]),
  lastActivity: lastActivitySchema.nullable().optional(),
})

export type ActivityProgressInput = z.infer<typeof activityProgressSchema>
export type ChapterProgressInput = z.infer<typeof chapterProgressSchema>
export type MergeProgressInput = z.infer<typeof mergeProgressSchema>

export const gameProgressSchema = z.object({
  won: z.boolean().optional().default(true),
  gameId: z.string().max(50).optional(),
  score: z.number().min(0).optional(),
  currentStreak: z.number().min(0).optional(),
  bestStreak: z.number().min(0).optional(),
})
