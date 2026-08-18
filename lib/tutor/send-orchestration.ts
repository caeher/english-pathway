import type { SessionOrchestration } from '@/components/voice/session-types'
import { getInstructionalLanguagePolicy, toCefrLevel } from '@/lib/tutor/learner-profile'

function buildGreetingAndStartDirective(orchestration: SessionOrchestration): string {
  const level = toCefrLevel(orchestration.learner?.level)
  const nativeLanguage = orchestration.learner?.nativeLanguageLabel

  if (level === 'A1') {
    if (nativeLanguage) {
      return `Start speaking now; do not wait for me to speak first. Greet me warmly in my native language (${nativeLanguage}), state my level (A1), and introduce the recommended topic or ask for my interest in ${nativeLanguage}. Deliver explanations, instructions, and corrections primarily in ${nativeLanguage}; keep pronunciation targets, vocabulary words, and short model examples in English. Do not show an activity until I choose or confirm the topic.`
    }
    return 'Start speaking now; do not wait for me to speak first. Greet me in simple English, state my level (A1), and offer the recommended topic or ask for an interest in simple, clear words. Do not show an activity until I choose or confirm the topic.'
  }

  if (level === 'A2') {
    if (nativeLanguage) {
      return `Start speaking now; do not wait for me to speak first. Greet me in my native language (${nativeLanguage}), state my level (A2), and introduce the topic in ${nativeLanguage} with simple guided English phrases. Deliver explanations mostly in ${nativeLanguage} with guided English practice. Do not show an activity until I choose or confirm the topic.`
    }
    return 'Start speaking now; do not wait for me to speak first. Greet me in clear, simple English, state my level (A2), and offer the recommended topic or ask for an interest with step-by-step guidance. Do not show an activity until I choose or confirm the topic.'
  }

  if (level === 'B1') {
    if (nativeLanguage) {
      return `Start speaking now; do not wait for me to speak first. Greet me in English, state my level (B1), and offer the recommended topic or ask for an interest in English. Conduct the lesson English-first as the main practice language; use ${nativeLanguage} only for targeted clarification if needed. Do not show an activity until I choose or confirm the topic.`
    }
    return 'Start speaking now; do not wait for me to speak first. Greet me in English, state my level (B1), and offer the recommended topic or ask for an interest in clear, natural English. Do not show an activity until I choose or confirm the topic.'
  }

  if (level === 'B2') {
    if (nativeLanguage) {
      return `Start speaking now; do not wait for me to speak first. Greet me in English, state my level (B2), and offer the recommended topic or ask for an interest in English. Teach predominantly in English; use ${nativeLanguage} only for limited scaffolding when strictly necessary. Do not show an activity until I choose or confirm the topic.`
    }
    return 'Start speaking now; do not wait for me to speak first. Greet me in English, state my level (B2), and offer the recommended topic or ask for an interest in natural, practical English. Do not show an activity until I choose or confirm the topic.'
  }

  if (level === 'C1') {
    if (nativeLanguage) {
      return `Start speaking now; do not wait for me to speak first. Greet me in English, state my level (C1), and offer the recommended topic or ask for an interest in English. Conduct nearly all explanations, examples, and conversation in English; use ${nativeLanguage} only if I explicitly ask for clarification. Do not show an activity until I choose or confirm the topic.`
    }
    return 'Start speaking now; do not wait for me to speak first. Greet me in English, state my level (C1), and offer the recommended topic or ask for an interest in fluent, nuanced English. Do not show an activity until I choose or confirm the topic.'
  }

  if (level === 'C2') {
    if (nativeLanguage) {
      return `Start speaking now; do not wait for me to speak first. Greet me in English, state my level (C2), and offer the recommended topic or ask for an interest in English. Maintain full English immersion throughout the lesson unless I explicitly ask for clarification in ${nativeLanguage}. Do not show an activity until I choose or confirm the topic.`
    }
    return 'Start speaking now; do not wait for me to speak first. Greet me in English, state my level (C2), and offer the recommended topic or ask for an interest in advanced, fluent English immersion. Do not show an activity until I choose or confirm the topic.'
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
