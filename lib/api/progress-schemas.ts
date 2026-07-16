import { z } from 'zod'

const progressStatus = z.enum(['not_started', 'in_progress', 'completed'])

export const activityProgressSchema = z.object({
  activityId: z.string().min(1),
  status: progressStatus,
  score: z.number().min(0).max(100).optional(),
  attempts: z.number().int().min(0).max(1000).optional(),
  activityType: z.string().max(50).optional(),
  chapterId: z.string().max(100).optional(),
})

export const chapterProgressSchema = z.object({
  chapterId: z.string().min(1),
  status: progressStatus,
})

export const gameProgressSchema = z.object({
  won: z.boolean().optional().default(true),
  gameId: z.string().max(50).optional(),
  score: z.number().min(0).optional(),
  currentStreak: z.number().min(0).optional(),
  bestStreak: z.number().min(0).optional(),
})
