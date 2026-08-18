import { describe, expect, it } from 'vitest'
import {
  buildActivityInstructionText,
  getActivityHintLabel,
  getActivityInstructionalLanguagePolicy,
  getActivityResumeCopy,
  shouldApplyNativeActivityUi,
} from '@/lib/learn/activity-language-policy'

describe('activity-language-policy', () => {
  describe('getActivityInstructionalLanguagePolicy', () => {
    it('returns Spanish-first activity policy for A1 Spanish learner', () => {
      const policy = getActivityInstructionalLanguagePolicy('A1', 'Spanish')
      expect(policy).toContain('Activity instructional language policy (A1 Beginner):')
      expect(policy).toContain('primarily in Spanish')
      expect(policy).toContain('set "context" (pedagogical purpose) and "expectedAction" (step-by-step direction) in Spanish')
      expect(policy).toContain('target English learning material itself (vocabulary words, pronunciation targets, multiple-choice options, answers, and model examples) must remain 100% in English')
      expect(policy).toContain('provide concise scaffolding in Spanish without clearing or resetting the activity')
    })

    it('returns simple English policy for A1 learner without native language', () => {
      const policy = getActivityInstructionalLanguagePolicy('A1', null)
      expect(policy).toContain('Activity instructional language policy (A1 Beginner):')
      expect(policy).toContain('very simple, clear English')
      expect(policy).toContain('Set "context" and "expectedAction" in simple English')
    })

    it('returns mostly-native policy for A2 learner', () => {
      const policy = getActivityInstructionalLanguagePolicy('A2', 'Spanish')
      expect(policy).toContain('Activity instructional language policy (A2 Elementary):')
      expect(policy).toContain('mostly in Spanish accompanied by guided English phrases')
      expect(policy).toContain('Keep all practice items, target sentences, and answers in English')
    })

    it('returns balanced English-first transition policy for B1 learner', () => {
      const policy = getActivityInstructionalLanguagePolicy('B1', 'Italian')
      expect(policy).toContain('Activity instructional language policy (B1 Intermediate):')
      expect(policy).toContain('Balanced transition with English as the primary activity language')
      expect(policy).toContain('Set "context" and "expectedAction" in English')
      expect(policy).toContain('Use Italian only for targeted clarification')
    })

    it('returns predominantly English policy for B2 learner', () => {
      const policy = getActivityInstructionalLanguagePolicy('B2', 'Portuguese')
      expect(policy).toContain('Activity instructional language policy (B2 Upper Intermediate):')
      expect(policy).toContain('Predominantly English activity instruction')
      expect(policy).toContain('Set "context" and "expectedAction" in English')
    })

    it('returns English immersion policy for C1 learner', () => {
      const policy = getActivityInstructionalLanguagePolicy('C1', 'French')
      expect(policy).toContain('Activity instructional language policy (C1 Advanced):')
      expect(policy).toContain('Conduct all activity introductions, directions, hints, and feedback entirely in English')
      expect(policy).toContain('Use French only if the learner explicitly asks for clarification or translation')
    })

    it('returns full English immersion policy for C2 learner', () => {
      const policy = getActivityInstructionalLanguagePolicy('C2', 'German')
      expect(policy).toContain('Activity instructional language policy (C2 Mastery):')
      expect(policy).toContain('Full English immersion throughout the entire activity lifecycle')
      expect(policy).toContain('Use German only if the learner explicitly requests clarification in German')
    })

    it('handles legacy level strings like beginner and intermediate', () => {
      expect(getActivityInstructionalLanguagePolicy('beginner', 'Spanish')).toContain('A1 Beginner')
      expect(getActivityInstructionalLanguagePolicy('intermediate', 'Spanish')).toContain('B1 Intermediate')
      expect(getActivityInstructionalLanguagePolicy('advanced', 'Spanish')).toContain('C1 Advanced')
    })
  })

  describe('shouldApplyNativeActivityUi', () => {
    it('returns true for Spanish A1 and A2 learners', () => {
      expect(shouldApplyNativeActivityUi('A1', 'es')).toBe(true)
      expect(shouldApplyNativeActivityUi('A2', 'es')).toBe(true)
      expect(shouldApplyNativeActivityUi('beginner', 'es')).toBe(true)
    })

    it('returns false for B1, B2, C1, C2 even with Spanish', () => {
      expect(shouldApplyNativeActivityUi('B1', 'es')).toBe(false)
      expect(shouldApplyNativeActivityUi('B2', 'es')).toBe(false)
      expect(shouldApplyNativeActivityUi('C1', 'es')).toBe(false)
      expect(shouldApplyNativeActivityUi('C2', 'es')).toBe(false)
    })

    it('returns false for non-Spanish languages or missing native language', () => {
      expect(shouldApplyNativeActivityUi('A1', 'fr')).toBe(false)
      expect(shouldApplyNativeActivityUi('A1', null)).toBe(false)
      expect(shouldApplyNativeActivityUi(null, 'es')).toBe(false)
    })
  })

  describe('buildActivityInstructionText', () => {
    it('generates Spanish instructions for A1 Spanish learner with keyboard and audio', () => {
      const text = buildActivityInstructionText('quiz', ['keyboard', 'audio'], 'A1', 'es')
      expect(text).toContain('Completa la actividad de quiz a tu propio ritmo.')
      expect(text).toContain('Usa los controles y atajos de teclado;')
      expect(text).toContain('escucha el audio disponible;')
      expect(text).toContain('Reiniciar borra solo este intento actual; Saltar y Salir guardan tu progreso para continuar después.')
    })

    it('generates English instructions for C1 learner', () => {
      const text = buildActivityInstructionText('quiz', ['keyboard', 'audio'], 'C1', 'es')
      expect(text).toContain('Complete the quiz activity at your pace.')
      expect(text).toContain('Use its labelled controls and keyboard shortcuts;')
      expect(text).toContain('listen to audio prompts where available;')
    })
  })

  describe('getActivityHintLabel', () => {
    it('returns Spanish hint labels for A1 Spanish learner', () => {
      expect(getActivityHintLabel(1, 'A1', 'es')).toBe('Recordatorio')
      expect(getActivityHintLabel(2, 'A1', 'es')).toBe('Pista parcial')
      expect(getActivityHintLabel(3, 'A1', 'es')).toBe('Explicación')
    })

    it('returns English hint labels for B1 or C2 learner', () => {
      expect(getActivityHintLabel(1, 'B1', 'es')).toBe('Reminder')
      expect(getActivityHintLabel(2, 'B1', 'es')).toBe('Partial hint')
      expect(getActivityHintLabel(3, 'C2', 'es')).toBe('Explanation')
    })
  })

  describe('getActivityResumeCopy', () => {
    it('returns Spanish resume copy for A1 Spanish learner', () => {
      const copy = getActivityResumeCopy('A1', 'es')
      expect(copy.title).toBe('¿Continuar donde lo dejaste?')
      expect(copy.resume).toBe('Reanudar')
      expect(copy.startOver).toBe('Empezar de nuevo')
    })

    it('returns English resume copy for B1 or C1 learner', () => {
      const copy = getActivityResumeCopy('B1', 'es')
      expect(copy.title).toBe('Continue where you left off?')
      expect(copy.resume).toBe('Resume')
      expect(copy.startOver).toBe('Start over')
    })
  })
})
