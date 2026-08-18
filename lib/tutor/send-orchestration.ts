import type { SessionOrchestration } from '@/components/voice/session-types'
import { getInstructionalLanguagePolicy, toCefrBand } from '@/lib/tutor/learner-profile'

function buildGreetingAndStartDirective(orchestration: SessionOrchestration): string {
  const level = orchestration.learner?.level
  const band = toCefrBand(level)
  const nativeLanguage = orchestration.learner?.nativeLanguageLabel

  if (band === 'A1-A2') {
    if (nativeLanguage) {
      return `Start speaking now; do not wait for me to speak first. Greet me briefly in my native language (${nativeLanguage}), state my level (${level ?? 'A1'}), and offer the recommended topic or ask for an interest. Explain grammar, directions, and corrections in ${nativeLanguage}; keep pronunciation targets, vocabulary words, and practice in English. Do not show an activity until I choose or confirm the topic.`
    }
    return `Start speaking now; do not wait for me to speak first. Greet me in simple English, state my level (${level ?? 'A1'}), and offer the recommended topic or ask for an interest in simple, clear words. Do not show an activity until I choose or confirm the topic.`
  }

  if (band === 'B1-B2') {
    if (nativeLanguage) {
      return `Start speaking now; do not wait for me to speak first. Greet me in English, state my level (${level ?? 'B1'}), and offer the recommended topic or ask for an interest. Conduct the lesson English-first; use ${nativeLanguage} only if I get stuck or explicitly ask for clarification. Do not show an activity until I choose or confirm the topic.`
    }
    return `Start speaking now; do not wait for me to speak first. Greet me in English, state my level (${level ?? 'B1'}), and offer the recommended topic or ask for an interest. Deliver explanations and feedback in clear, practical English. Do not show an activity until I choose or confirm the topic.`
  }

  if (band === 'C1-C2') {
    return `Start speaking now; do not wait for me to speak first. Greet me in English, state my level (${level ?? 'C1'}), and offer the recommended topic or ask for an interest. Maintain full English immersion throughout the lesson. Do not show an activity until I choose or confirm the topic.`
  }

  if (nativeLanguage) {
    return `Start speaking now; do not wait for me to speak first. Greet me warmly, state the level if known, and offer the recommended topic. Teach in English, offering brief support in ${nativeLanguage} if needed. Do not show an activity until I choose or confirm the topic.`
  }

  return 'Start speaking now; do not wait for me to speak first. Greet me in English, state the level if known, and offer the recommended topic or ask for an interest. Do not show an activity until I choose or confirm the topic.'
}

export function buildOrchestrationMessage(orchestration?: SessionOrchestration): string | null {
  if (!orchestration) return null
  const parts: string[] = []
  if (orchestration.instruction) parts.push(orchestration.instruction)
  if (orchestration.learner?.fullName) parts.push(`Learner name: ${orchestration.learner.fullName}.`)
  if (orchestration.learner?.level) parts.push(`Learner level: ${orchestration.learner.level}.`)
  if (orchestration.learner?.nativeLanguageLabel) parts.push(`Learner native language: ${orchestration.learner.nativeLanguageLabel}.`)
  
  if (orchestration.learner) {
    parts.push(getInstructionalLanguagePolicy(orchestration.learner.level, orchestration.learner.nativeLanguageLabel))
  }

  if (orchestration.progress?.lastChapterId) parts.push(`Last chapter studied: ${orchestration.progress.lastChapterId}.`)
  if (orchestration.progress?.lastActivityId) parts.push(`Last activity completed: ${orchestration.progress.lastActivityId}.`)
  if (orchestration.recommendation) parts.push(`Recommended continuation: chapter ${orchestration.recommendation.chapterId}${orchestration.recommendation.activityId ? `, activity ${orchestration.recommendation.activityId}` : ''}.`)
  
  const startDirective = buildGreetingAndStartDirective(orchestration)
  parts.push(startDirective)

  return parts.join(' ')
}
