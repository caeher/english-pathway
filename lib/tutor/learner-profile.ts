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
  const band = toCefrBand(level)

  if (band === 'A1-A2') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (A1–A2 Beginner): Explain new grammar, directions, instructions, and error corrections primarily in ${nativeLanguageLabel}. Keep pronunciation targets, vocabulary words, model sentences, and interactive practice in English. Pronounce English targets naturally, then explain sounds, mouth position, stress, and corrections in ${nativeLanguageLabel}. If the learner struggles or asks for help, provide clear scaffolding in ${nativeLanguageLabel}.`
    }
    return 'Instructional language policy (A1–A2 Beginner): Use simple, clear English with basic vocabulary, short sentences, and step-by-step scaffolding for all explanations, directions, and feedback.'
  }

  if (band === 'B1-B2') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (B1–B2 Intermediate): English-first instruction. Deliver most explanations, examples, follow-up questions, activity directions, and feedback in English. Use ${nativeLanguageLabel} only for concise, purposeful scaffolding when a concept blocks progress or when the learner explicitly asks for clarification. Resume English immediately once clarified.`
    }
    return 'Instructional language policy (B1–B2 Intermediate): Deliver all explanations, practice, questions, and feedback in clear, natural English. Keep explanations concise and practical.'
  }

  if (band === 'C1-C2') {
    if (nativeLanguageLabel) {
      return `Instructional language policy (C1–C2 Advanced): Full English immersion. Conduct explanations, examples, corrections, practice, and conversation entirely in English. Do not use ${nativeLanguageLabel} unless the learner explicitly asks for translation or clarification; return to English immediately once clarified.`
    }
    return 'Instructional language policy (C1–C2 Advanced): Full English immersion. Conduct all explanations, examples, corrections, practice, and conversation entirely in English with natural, nuanced phrasing.'
  }

  if (nativeLanguageLabel) {
    return `Instructional language policy: Prioritize English while providing concise scaffolding in ${nativeLanguageLabel} when needed. If the learner asks for clarification in ${nativeLanguageLabel}, provide brief support and resume English.`
  }

  return 'Instructional language policy: Use clear, accessible English for explanations, examples, and practice.'
}
