/** Public API for curriculum resolution, navigation, and progress calculations. */
export { resolveAllModules, resolveChapter, resolveChapterNav, resolveModule } from '@/lib/content/resolve'
export { curriculumChapterHref, curriculumModuleHref, learnHref } from '@/lib/curriculum/href'
export {
  getChapterProgress,
  getLearningTarget,
  getModuleProgress,
  type CurriculumProgressSnapshot,
} from '@/lib/curriculum/progress'
export * from './contracts'
