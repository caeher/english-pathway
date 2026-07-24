import { z } from 'zod'
import type { ActivityTypeKey } from './contracts'

export const ACTIVITY_SNAPSHOT_VERSION = 1 as const

export interface ActivityProgressSnapshot {
  version: typeof ACTIVITY_SNAPSHOT_VERSION
  activityId: string
  activityType: ActivityTypeKey
  savedAt: string
  payload: unknown
}

export interface ActivitySnapshotContract<T = unknown> {
  version: typeof ACTIVITY_SNAPSHOT_VERSION
  schema: z.ZodType<T>
  summarize: (payload: T) => string
  isRestorable: (payload: T) => boolean
}

export type AnyActivitySnapshotContract = ActivitySnapshotContract<any>

export const activityProgressSnapshotSchema = z.object({
  version: z.literal(ACTIVITY_SNAPSHOT_VERSION),
  activityId: z.string().min(1).max(160),
  activityType: z.string().min(1).max(50),
  savedAt: z.string().min(1),
  payload: z.unknown(),
})
