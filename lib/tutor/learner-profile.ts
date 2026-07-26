import { getNativeLanguageLabel, isNativeLanguageCode } from '@/lib/languages/native-languages'

const LEGACY_CEFR_LEVELS = {
  beginner: 'A1',
  intermediate: 'B1',
  advanced: 'C1',
} as const

export function toCefrLevel(level: string | null | undefined): string | null {
  if (!level) return null
  return LEGACY_CEFR_LEVELS[level as keyof typeof LEGACY_CEFR_LEVELS] ?? level.toUpperCase()
}

export function getLearnerLanguageLabel(language: string | null | undefined): string | null {
  return language && isNativeLanguageCode(language) ? getNativeLanguageLabel(language) : null
}
