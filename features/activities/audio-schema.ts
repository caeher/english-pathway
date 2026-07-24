import { z } from 'zod'

export const audioPracticeModeSchema = z.enum(['guided', 'evaluation'])

export const curatedAudioSchema = z.object({
  src: z.string().min(1),
  transcript: z.string().min(1),
  speaker: z.string().min(1).optional(),
  accent: z.string().min(1).optional(),
  defaultRate: z.number().min(0.5).max(2).optional(),
  altText: z.string().min(1).optional(),
})

export const contrastPairSchema = z.object({
  label: z.string().min(1),
  wordA: z.string().min(1),
  wordB: z.string().min(1),
  phoneme: z.string().min(1),
  tip: z.string().min(1),
})

export type CuratedAudio = z.infer<typeof curatedAudioSchema>
export type ContrastPair = z.infer<typeof contrastPairSchema>
export type AudioPracticeMode = z.infer<typeof audioPracticeModeSchema>

const curatedAudioSrcPattern = /^(\/audio\/|https?:\/\/)/

export function isValidCuratedAudioSrc(src: string): boolean {
  return curatedAudioSrcPattern.test(src)
}

export function resolveAudioPracticeMode(
  mode: AudioPracticeMode | undefined,
  hasCuratedAudio: boolean,
): AudioPracticeMode {
  if (mode) return mode
  return hasCuratedAudio ? 'evaluation' : 'guided'
}
