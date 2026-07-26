import type { LearningTarget } from '@/lib/curriculum/progress'
import { curriculumChapterHref } from '@/lib/curriculum/href'

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
      kind: 'resume',
      href: curriculumChapterHref(input.resume.moduleId, input.resume.chapterId),
      label: 'Continue chapter',
      title: 'Continue where you left off',
      description: 'Pick up the structured chapter where you left off.',
      target: input.resume,
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
    description: 'Browse modules and start the structured pathway.',
  }
}
