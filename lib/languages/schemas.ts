import { z } from 'zod'
import { NATIVE_LANGUAGE_CODES } from './native-languages'

export const nativeLanguageSchema = z.enum(NATIVE_LANGUAGE_CODES)

export const optionalNativeLanguageSchema = nativeLanguageSchema.nullish()
