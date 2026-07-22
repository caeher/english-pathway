import type { Transition, Variants } from 'framer-motion'

/** Shared orientation and feedback motion. Game-specific direct manipulation stays local. */
export const motionDurations = {
  feedback: 0.2,
  panel: 0.24,
  page: 0.28,
  reveal: 0.4,
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

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: motionDurations.reveal, ease: motionEase } },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: motionDurations.reveal, ease: motionEase } },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: motionDurations.reveal, ease: motionEase } },
}

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})

export const heroMockupVariants: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: motionEase, delay: 0.15 },
  },
}

export const chatBubbleVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: motionEase },
  },
}

