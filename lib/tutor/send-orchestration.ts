import type { SessionOrchestration } from '@/components/voice/session-types'

export function buildOrchestrationMessage(orchestration?: SessionOrchestration): string | null {
  if (!orchestration) return null
  const parts: string[] = []
  if (orchestration.instruction) parts.push(orchestration.instruction)
  if (orchestration.learner?.level) parts.push(`Learner level: ${orchestration.learner.level}.`)
  if (orchestration.progress?.lastChapterId) parts.push(`Last chapter studied: ${orchestration.progress.lastChapterId}.`)
  if (orchestration.progress?.lastActivityId) parts.push(`Last activity completed: ${orchestration.progress.lastActivityId}.`)
  if (parts.length === 0) return null
  return `${parts.join(' ')} Greet me briefly, then use showGrammar to display a one-sentence welcome tip in the learning panel, and ask what English skill I want to practise today.`
}
