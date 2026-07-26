import type { SessionOrchestration } from '@/components/voice/session-types'

export function buildOrchestrationMessage(orchestration?: SessionOrchestration): string | null {
  if (!orchestration) return null
  const parts: string[] = []
  if (orchestration.instruction) parts.push(orchestration.instruction)
  if (orchestration.learner?.fullName) parts.push(`Learner name: ${orchestration.learner.fullName}.`)
  if (orchestration.learner?.level) parts.push(`Learner level: ${orchestration.learner.level}.`)
  if (orchestration.learner?.nativeLanguageLabel) parts.push(`The learner native language is ${orchestration.learner.nativeLanguageLabel}. Keep all instructions, explanations, activity directions, and pronunciation coaching in ${orchestration.learner.nativeLanguageLabel}; say only English target words and examples in English.`)
  if (orchestration.progress?.lastChapterId) parts.push(`Last chapter studied: ${orchestration.progress.lastChapterId}.`)
  if (orchestration.progress?.lastActivityId) parts.push(`Last activity completed: ${orchestration.progress.lastActivityId}.`)
  if (orchestration.recommendation) parts.push(`Recommended continuation: chapter ${orchestration.recommendation.chapterId}${orchestration.recommendation.activityId ? `, activity ${orchestration.recommendation.activityId}` : ''}.`)
  if (parts.length === 0) return null
  return `${parts.join(' ')} Start speaking now; do not wait for me to speak first. Greet me briefly in my native language when available. State the level and offer the recommended topic or ask for an interest. Do not show an activity until I choose or confirm the topic.`
}
