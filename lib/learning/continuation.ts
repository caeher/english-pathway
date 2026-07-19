import type { LearningTarget } from '@/lib/curriculum/progress'
import { learnHref } from '@/lib/curriculum/href'

export type LearningContinuation =
  | { kind: 'review'; href: '/review'; label: string; title: string; description: string }
  | { kind: 'resume'; href: string; label: string; title: string; description: string; target: LearningTarget }
  | { kind: 'start'; href: '/curriculum'; label: string; title: string; description: string }
  | { kind: 'completed'; href: '/review'; label: string; title: string; description: string }

export function getLearningContinuation(input: {
  dueReviews: number
  resume: LearningTarget | null
  completedChapters: number
  totalChapters: number
}): LearningContinuation {
  if (input.dueReviews > 0) {
    return {
      kind: 'review', href: '/review', label: `Review ${input.dueReviews} due`,
      title: input.dueReviews === 1 ? 'One review is due' : `${input.dueReviews} reviews are due`,
      description: 'Strengthen previous learning before starting something new.',
    }
  }
  if (input.resume) {
    return {
      kind: 'resume', href: learnHref(input.resume), label: 'Resume learning',
      title: 'Continue where you left off',
      description: 'Return to your next available activity with its chapter context preserved.', target: input.resume,
    }
  }
  if (input.totalChapters > 0 && input.completedChapters >= input.totalChapters) {
    return {
      kind: 'completed', href: '/review', label: 'Keep skills fresh', title: 'Curriculum complete',
      description: 'Great work. Use review to keep the material active.',
    }
  }
  return {
    kind: 'start', href: '/curriculum', label: 'Choose a chapter', title: 'Start your learning path',
    description: 'Pick a chapter and we will guide you through the next activity.',
  }
}
