import { describe, expect, it } from 'vitest'
import {
  getInstructionalLanguagePolicy,
  getLearnerLanguageLabel,
  toCefrBand,
  toCefrLevel,
} from '@/lib/tutor/learner-profile'

describe('learner-profile', () => {
  describe('toCefrLevel', () => {
    it('maps legacy levels to standard CEFR levels', () => {
      expect(toCefrLevel('beginner')).toBe('A1')
      expect(toCefrLevel('intermediate')).toBe('B1')
      expect(toCefrLevel('advanced')).toBe('C1')
    })

    it('normalizes uppercase CEFR codes', () => {
      expect(toCefrLevel('a1')).toBe('A1')
      expect(toCefrLevel('a2')).toBe('A2')
      expect(toCefrLevel('b1')).toBe('B1')
      expect(toCefrLevel('b2')).toBe('B2')
      expect(toCefrLevel('c1')).toBe('C1')
      expect(toCefrLevel('c2')).toBe('C2')
    })

    it('returns null for null or undefined input', () => {
      expect(toCefrLevel(null)).toBeNull()
      expect(toCefrLevel(undefined)).toBeNull()
      expect(toCefrLevel('')).toBeNull()
    })
  })

  describe('toCefrBand', () => {
    it('classifies A1 and A2 into A1-A2 band', () => {
      expect(toCefrBand('A1')).toBe('A1-A2')
      expect(toCefrBand('a1')).toBe('A1-A2')
      expect(toCefrBand('A2')).toBe('A1-A2')
      expect(toCefrBand('beginner')).toBe('A1-A2')
    })

    it('classifies B1 and B2 into B1-B2 band', () => {
      expect(toCefrBand('B1')).toBe('B1-B2')
      expect(toCefrBand('b1')).toBe('B1-B2')
      expect(toCefrBand('B2')).toBe('B1-B2')
      expect(toCefrBand('intermediate')).toBe('B1-B2')
    })

    it('classifies C1 and C2 into C1-C2 band', () => {
      expect(toCefrBand('C1')).toBe('C1-C2')
      expect(toCefrBand('c1')).toBe('C1-C2')
      expect(toCefrBand('C2')).toBe('C1-C2')
      expect(toCefrBand('advanced')).toBe('C1-C2')
    })

    it('returns null for invalid or missing levels', () => {
      expect(toCefrBand(null)).toBeNull()
      expect(toCefrBand(undefined)).toBeNull()
      expect(toCefrBand('unknown')).toBeNull()
    })
  })

  describe('getLearnerLanguageLabel', () => {
    it('resolves valid language codes to their display labels', () => {
      expect(getLearnerLanguageLabel('es')).toBe('Spanish')
      expect(getLearnerLanguageLabel('pt')).toBe('Portuguese')
      expect(getLearnerLanguageLabel('fr')).toBe('French')
      expect(getLearnerLanguageLabel('de')).toBe('German')
      expect(getLearnerLanguageLabel('ja')).toBe('Japanese')
    })

    it('returns null for invalid or empty codes', () => {
      expect(getLearnerLanguageLabel(null)).toBeNull()
      expect(getLearnerLanguageLabel(undefined)).toBeNull()
      expect(getLearnerLanguageLabel('xx')).toBeNull()
    })
  })

  describe('getInstructionalLanguagePolicy', () => {
    it('generates native-scaffolded policy for A1-A2 with a native language', () => {
      const policy = getInstructionalLanguagePolicy('A1', 'Spanish')
      expect(policy).toContain('A1–A2 Beginner')
      expect(policy).toContain('primarily in Spanish')
      expect(policy).toContain('vocabulary words, model sentences, and interactive practice in English')
      expect(policy).toContain('explain sounds, mouth position, stress, and corrections in Spanish')
    })

    it('generates simple English policy for A1-A2 without a native language', () => {
      const policy = getInstructionalLanguagePolicy('A2', null)
      expect(policy).toContain('A1–A2 Beginner')
      expect(policy).toContain('simple, clear English with basic vocabulary')
    })

    it('generates English-first policy with scaffolding for B1-B2 with a native language', () => {
      const policy = getInstructionalLanguagePolicy('B2', 'Portuguese')
      expect(policy).toContain('B1–B2 Intermediate')
      expect(policy).toContain('English-first instruction')
      expect(policy).toContain('Use Portuguese only for concise, purposeful scaffolding')
      expect(policy).toContain('Resume English immediately once clarified')
    })

    it('generates English-only immersion policy for C1-C2', () => {
      const policy = getInstructionalLanguagePolicy('C1', 'French')
      expect(policy).toContain('C1–C2 Advanced')
      expect(policy).toContain('Full English immersion')
      expect(policy).toContain('Do not use French unless the learner explicitly asks')
    })

    it('generates generic fallback policy when level is not specified', () => {
      const policyWithLang = getInstructionalLanguagePolicy(null, 'German')
      expect(policyWithLang).toContain('Prioritize English while providing concise scaffolding in German')

      const policyNoLang = getInstructionalLanguagePolicy(null, null)
      expect(policyNoLang).toContain('Use clear, accessible English')
    })
  })
})
