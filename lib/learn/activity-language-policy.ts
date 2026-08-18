import { toCefrLevel } from '@/lib/tutor/learner-profile'
import type { ActivityCapability } from '@/features/activities/runtime-contract'
import type { GraduatedHintLevel } from '@/features/activities/hints'

export function getActivityInstructionalLanguagePolicy(
  level: string | null | undefined,
  nativeLanguageLabel?: string | null,
): string {
  const normalizedLevel = toCefrLevel(level)

  if (normalizedLevel === 'A1') {
    if (nativeLanguageLabel) {
      return `Activity instructional language policy (A1 Beginner): When transitioning to practice, introduce the activity and deliver spoken directions, instructions, hints, error explanations, and post-activity feedback primarily in ${nativeLanguageLabel}. In the showActivity tool call, set "context" (pedagogical purpose) and "expectedAction" (step-by-step direction) in ${nativeLanguageLabel}. The target English learning material itself (vocabulary words, pronunciation targets, multiple-choice options, answers, and model examples) must remain 100% in English. If the learner asks for clarification during the activity, provide concise scaffolding in ${nativeLanguageLabel} without clearing or resetting the activity.`
    }
    return 'Activity instructional language policy (A1 Beginner): Deliver all activity introductions, directions, hints, step-by-step guidance, and feedback in very simple, clear English. Set "context" and "expectedAction" in simple English. Keep all practice items in English.'
  }

  if (normalizedLevel === 'A2') {
    if (nativeLanguageLabel) {
      return `Activity instructional language policy (A2 Elementary): Introduce activities and provide spoken directions mostly in ${nativeLanguageLabel} accompanied by guided English phrases. In the showActivity tool call, set "context" and "expectedAction" mostly in ${nativeLanguageLabel} with simple English action cues. Provide supportive error corrections in ${nativeLanguageLabel}. Keep all practice items, target sentences, and answers in English.`
    }
    return 'Activity instructional language policy (A2 Elementary): Deliver all activity introductions, directions, hints, and feedback in simple, accessible English with clear guidance. Keep all practice items in English.'
  }

  if (normalizedLevel === 'B1') {
    if (nativeLanguageLabel) {
      return `Activity instructional language policy (B1 Intermediate): Balanced transition with English as the primary activity language. Deliver activity introductions, directions, hints, and feedback in English. Set "context" and "expectedAction" in English. Use ${nativeLanguageLabel} only for targeted clarification when a concept blocks progress or when the learner explicitly requests it. Resume English immediately once clarified.`
    }
    return 'Activity instructional language policy (B1 Intermediate): Deliver all activity introductions, directions, hints, questions, and feedback in clear, natural English. Keep all practice items in English.'
  }

  if (normalizedLevel === 'B2') {
    if (nativeLanguageLabel) {
      return `Activity instructional language policy (B2 Upper Intermediate): Predominantly English activity instruction. Deliver all activity introductions, directions, hints, follow-up practice, and feedback in English. Set "context" and "expectedAction" in English. Provide limited ${nativeLanguageLabel} scaffolding only when strictly necessary or requested.`
    }
    return 'Activity instructional language policy (B2 Upper Intermediate): Deliver all activity introductions, directions, hints, and feedback in natural, practical English.'
  }

  if (normalizedLevel === 'C1') {
    if (nativeLanguageLabel) {
      return `Activity instructional language policy (C1 Advanced): Conduct all activity introductions, directions, hints, and feedback entirely in English. Set "context" and "expectedAction" in English. Use ${nativeLanguageLabel} only if the learner explicitly asks for clarification or translation.`
    }
    return 'Activity instructional language policy (C1 Advanced): Full English immersion. Deliver all activity introductions, directions, hints, and feedback entirely in English with natural, nuanced phrasing.'
  }

  if (normalizedLevel === 'C2') {
    if (nativeLanguageLabel) {
      return `Activity instructional language policy (C2 Mastery): Full English immersion throughout the entire activity lifecycle. Deliver all introductions, directions, hints, and feedback in fluent English. Use ${nativeLanguageLabel} only if the learner explicitly requests clarification in ${nativeLanguageLabel}.`
    }
    return 'Activity instructional language policy (C2 Mastery): Full English immersion throughout all activity introductions, directions, hints, and feedback.'
  }

  if (nativeLanguageLabel) {
    return `Activity instructional language policy: Prioritize English for activity practice while providing supportive scaffolding in ${nativeLanguageLabel} when appropriate for the learner's proficiency.`
  }

  return 'Activity instructional language policy: Use clear, accessible English for all activity introductions, directions, and feedback.'
}

export function shouldApplyNativeActivityUi(
  level: string | null | undefined,
  nativeLanguage: string | null | undefined,
): boolean {
  if (!nativeLanguage) return false
  const normalizedLevel = toCefrLevel(level)
  const isA1A2 = normalizedLevel === 'A1' || normalizedLevel === 'A2'
  return isA1A2 && (nativeLanguage === 'es' || nativeLanguage.toLowerCase().startsWith('es'))
}

export function buildActivityInstructionText(
  activityType: string,
  accessibilityCapabilities: readonly ActivityCapability[],
  level?: string | null,
  nativeLanguage?: string | null,
): string {
  const isSpanishA1A2 = shouldApplyNativeActivityUi(level, nativeLanguage)

  if (isSpanishA1A2) {
    const parts = [`Completa la actividad de ${activityType} a tu propio ritmo.`]

    if (accessibilityCapabilities.includes('keyboard')) {
      parts.push('Usa los controles y atajos de teclado;')
    } else {
      parts.push('Usa los controles interactivos;')
    }

    if (accessibilityCapabilities.includes('audio')) {
      parts.push('escucha el audio disponible;')
    }

    if (accessibilityCapabilities.includes('microphone')) {
      parts.push('permite el acceso al micrófono para practicar pronunciación;')
    }

    parts.push('Reiniciar borra solo este intento actual; Saltar y Salir guardan tu progreso para continuar después.')
    return parts.join(' ')
  }

  const parts = [`Complete the ${activityType} activity at your pace.`]

  if (accessibilityCapabilities.includes('keyboard')) {
    parts.push('Use its labelled controls and keyboard shortcuts;')
  } else {
    parts.push('Use its labelled controls;')
  }

  if (accessibilityCapabilities.includes('audio')) {
    parts.push('listen to audio prompts where available;')
  }

  if (accessibilityCapabilities.includes('microphone')) {
    parts.push('allow microphone access for speaking practice;')
  }

  parts.push('restart clears only this attempt, while Skip and Exit keep the activity available to resume later.')
  return parts.join(' ')
}

const HINT_LABELS_EN: Record<GraduatedHintLevel, string> = {
  1: 'Reminder',
  2: 'Partial hint',
  3: 'Explanation',
}

const HINT_LABELS_ES: Record<GraduatedHintLevel, string> = {
  1: 'Recordatorio',
  2: 'Pista parcial',
  3: 'Explicación',
}

export function getActivityHintLabel(
  level: GraduatedHintLevel,
  learnerLevel?: string | null,
  nativeLanguage?: string | null,
): string {
  if (shouldApplyNativeActivityUi(learnerLevel, nativeLanguage)) {
    return HINT_LABELS_ES[level] ?? HINT_LABELS_EN[level]
  }
  return HINT_LABELS_EN[level]
}

export function getActivityResumeCopy(
  learnerLevel?: string | null,
  nativeLanguage?: string | null,
) {
  if (shouldApplyNativeActivityUi(learnerLevel, nativeLanguage)) {
    return {
      title: '¿Continuar donde lo dejaste?',
      resume: 'Reanudar',
      startOver: 'Empezar de nuevo',
      ariaLabel: 'Progreso guardado encontrado. Elige Reanudar o Empezar de nuevo.',
    }
  }
  return {
    title: 'Continue where you left off?',
    resume: 'Resume',
    startOver: 'Start over',
    ariaLabel: 'Saved progress found. Choose Resume or Start over.',
  }
}
