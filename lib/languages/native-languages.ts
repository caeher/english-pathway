export const NATIVE_LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ru', label: 'Russian' },
  { code: 'it', label: 'Italian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'tr', label: 'Turkish' },
  { code: 'pl', label: 'Polish' },
  { code: 'nl', label: 'Dutch' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'id', label: 'Indonesian' },
  { code: 'th', label: 'Thai' },
  { code: 'bn', label: 'Bengali' },
] as const

export type NativeLanguageCode = (typeof NATIVE_LANGUAGES)[number]['code']

export const NATIVE_LANGUAGE_CODES = NATIVE_LANGUAGES.map((language) => language.code)

const nativeLanguageCodeSet = new Set<string>(NATIVE_LANGUAGE_CODES)

export function isNativeLanguageCode(value: string): value is NativeLanguageCode {
  return nativeLanguageCodeSet.has(value)
}

export function getNativeLanguageLabel(code: NativeLanguageCode): string {
  const language = NATIVE_LANGUAGES.find((item) => item.code === code)
  return language?.label ?? code
}
