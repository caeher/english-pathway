import type { Transition, Variants } from 'framer-motion'

/** Shared orientation and feedback motion. Game-specific direct manipulation stays local. */
export const motionDurations = {
  feedback: 0.2,
  panel: 0.24,
  page: 0.28,
} as const

export const motionEase = [0.22, 1, 0.36, 1] as const

const orientingTransition: Transition = { duration: motionDurations.panel, ease: motionEase }

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: motionDurations.page, ease: motionEase } },
}

export const panelTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: orientingTransition },
  exit: { opacity: 0, y: -4, transition: { duration: motionDurations.feedback, ease: motionEase } },
}

export const resultTransition: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: motionDurations.feedback, ease: motionEase } },
}
