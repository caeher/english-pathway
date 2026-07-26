/** Public API for curriculum resolution, navigation, and progress calculations. */
export { resolveAllModules, resolveChapter, resolveChapterNav, resolveModule } from '@/lib/content/resolve'
export { curriculumChapterHref, curriculumModuleHref } from '@/lib/curriculum/href'
export {
  getChapterProgress,
  getCompletableChapterIds,
  getLearningTarget,
  getModuleProgress,
  type CurriculumProgressSnapshot,
  type ActivityExerciseState,
  type ExerciseSequenceState,
} from '@/lib/curriculum/progress'
export { evaluateActivityApproval, isActivityPassed } from '@/lib/curriculum/approval'
export * from './contracts'
