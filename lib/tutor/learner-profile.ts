import { getNativeLanguageLabel, isNativeLanguageCode } from '@/lib/languages/native-languages'

export type CefrBand = 'A1-A2' | 'B1-B2' | 'C1-C2'

const LEGACY_CEFR_LEVELS = {
  beginner: 'A1',
  intermediate: 'B1',
  advanced: 'C1',
} as const

export function toCefrLevel(level: string | null | undefined): string | null {
  if (!level) return null
  return LEGACY_CEFR_LEVELS[level.toLowerCase() as keyof typeof LEGACY_CEFR_LEVELS] ?? level.toUpperCase()
}

export function toCefrBand(level: string | null | undefined): CefrBand | null {
  const normalized = toCefrLevel(level)
  if (!normalized) return null
  if (normalized === 'A1' || normalized === 'A2') return 'A1-A2'
  if (normalized === 'B1' || normalized === 'B2') return 'B1-B2'
  if (normalized === 'C1' || normalized === 'C2') return 'C1-C2'
  return null
}

export function getLearnerLanguageLabel(language: string | null | undefined): string | null {
  return language && isNativeLanguageCode(language) ? getNativeLanguageLabel(language) : null
}

export function getInstructionalLanguagePolicy(
  level: string | null | undefined,
  nativeLanguageLabel?: string | null,
): string {
  const normalizedLevel = toCefrLevel(level)

  if (normalizedLevel === 'A1') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (A1 Beginner): Speak primarily in ${nativeLanguageLabel} for greetings, lesson opening, new grammar explanations, directions, instructions, and error corrections. Use English for pronunciation targets, vocabulary words, short model sentences, and brief guided practice. Pronounce English targets naturally, then explain sounds, mouth position, stress, and corrections in ${nativeLanguageLabel}. If the learner struggles or asks for help, provide clear scaffolding in ${nativeLanguageLabel}.`
    }
    return 'Instructional language policy (A1 Beginner): Use very simple, clear English with basic vocabulary, short sentences, and step-by-step scaffolding for all explanations, directions, and feedback.'
  }

  if (normalizedLevel === 'A2') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (A2 Elementary): Speak mostly in ${nativeLanguageLabel} for explanations, instructions, and error corrections, accompanied by a larger amount of guided English phrases and vocabulary. Gradually introduce simple English directions while maintaining supportive scaffolding in ${nativeLanguageLabel}. Keep pronunciation targets, model sentences, and interactive practice in English.`
    }
    return 'Instructional language policy (A2 Elementary): Use simple, clear English with basic vocabulary, guided practice, and step-by-step scaffolding for all explanations, directions, and feedback.'
  }

  if (normalizedLevel === 'B1') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (B1 Intermediate): Balanced transition with English as the main practice and conversational language. Deliver most explanations, directions, and feedback in English. Use ${nativeLanguageLabel} only for targeted clarification when a concept blocks progress or when the learner explicitly asks for clarification. Resume English immediately once clarified.`
    }
    return 'Instructional language policy (B1 Intermediate): Deliver all explanations, practice, questions, and feedback in clear, accessible English with natural conversational pacing.'
  }

  if (normalizedLevel === 'B2') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (B2 Upper Intermediate): Predominantly English instruction. Deliver all explanations, exercises, follow-up questions, directions, and feedback in English. Provide limited ${nativeLanguageLabel} scaffolding only when strictly necessary or requested. Resume English immediately once clarified.`
    }
    return 'Instructional language policy (B2 Upper Intermediate): Deliver all explanations, practice, questions, and feedback in natural, practical English with varied vocabulary and concise explanations.'
  }

  if (normalizedLevel === 'C1') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (C1 Advanced): Conduct nearly all explanation, examples, feedback, and conversation in English. Do not use ${nativeLanguageLabel} unless the learner explicitly asks for clarification or translation; resume English immediately once clarified.`
    }
    return 'Instructional language policy (C1 Advanced): Full English immersion. Conduct all explanations, examples, corrections, practice, and conversation entirely in English with natural, nuanced phrasing.'
  }

  if (normalizedLevel === 'C2') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (C2 Mastery): Full English immersion throughout the entire lesson for all explanations, feedback, and conversation. Use ${nativeLanguageLabel} only if the learner explicitly asks for clarification in ${nativeLanguageLabel}; resume English immediately once clarified.`
    }
    return 'Instructional language policy (C2 Mastery): Full English immersion throughout the entire lesson. Conduct all explanations, examples, corrections, practice, and conversation entirely in English with advanced, fluent phrasing.'
  }

  if (nativeLanguageLabel) {
    return `Instructional language policy: Prioritize English while providing concise scaffolding in ${nativeLanguageLabel} when needed. If the learner asks for clarification in ${nativeLanguageLabel}, provide brief support and resume English.`
  }

  return 'Instructional language policy: Use clear, accessible English for explanations, examples, and practice.'
}

