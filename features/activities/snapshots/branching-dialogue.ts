import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const branchingDialogueProgressSchema = z.object({
  currentNodeId: z.string().min(1),
  decisionIndex: z.number().int().min(0),
  choicesMade: z.array(z.object({
    nodeId: z.string().min(1),
    choiceId: z.string().min(1),
    pragmaticRating: z.enum(['optimal', 'acceptable', 'inappropriate']),
    grammaticalRating: z.enum(['correct', 'incorrect']),
  })),
  weakItemIndexes: z.array(z.number().int().min(0)),
  selectedChoiceIndex: z.number().int().min(0).nullable(),
  answered: z.boolean(),
  awaitingContinue: z.boolean(),
})

export type BranchingDialogueProgress = z.infer<typeof branchingDialogueProgressSchema>

export const branchingDialogueSnapshot: ActivitySnapshotContract<BranchingDialogueProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: branchingDialogueProgressSchema,
  summarize: (payload) => `Decision ${payload.decisionIndex + 1} · Node ${payload.currentNodeId}`,
  isRestorable: (payload) => Boolean(payload.currentNodeId),
}
