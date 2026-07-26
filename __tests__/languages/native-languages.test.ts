import { describe, expect, it } from 'vitest'
import {
  getNativeLanguageLabel,
  isNativeLanguageCode,
  NATIVE_LANGUAGES,
  NATIVE_LANGUAGE_CODES,
} from '@/lib/languages/native-languages'

describe('native language catalog', () => {
  it('contains unique codes and English labels', () => {
    const codes = NATIVE_LANGUAGES.map((language) => language.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(NATIVE_LANGUAGE_CODES).toEqual(codes)
    expect(NATIVE_LANGUAGES.every((language) => language.label.length > 0)).toBe(true)
  })

  it('validates supported codes', () => {
    expect(isNativeLanguageCode('es')).toBe(true)
    expect(isNativeLanguageCode('en')).toBe(false)
    expect(isNativeLanguageCode('')).toBe(false)
  })

  it('returns labels for supported codes', () => {
    expect(getNativeLanguageLabel('es')).toBe('Spanish')
    expect(getNativeLanguageLabel('ja')).toBe('Japanese')
  })
})
