import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const svgSceneProgressSchema = z.object({
  discoveredIds: z.array(z.string().min(1)),
})

export type SvgSceneProgress = z.infer<typeof svgSceneProgressSchema>

export const svgSceneSnapshot: ActivitySnapshotContract<SvgSceneProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: svgSceneProgressSchema,
  summarize: (payload) => `${payload.discoveredIds.length} objects discovered`,
  isRestorable: (payload) => payload.discoveredIds.length >= 0,
}
