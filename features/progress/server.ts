/** Server-side progress use cases and persistence operations. */
export {
  getCurriculumProgressSnapshot,
  getLastProgress,
  mergeLearningProgress,
  recordActivityProgress,
  recordChapterProgress,
  type LastProgress,
  type LearningActivityRow,
} from '@/lib/dal/learning-progress'
export { completeChapter, getCompletedChapterIds } from '@/lib/dal/chapter-completions'
