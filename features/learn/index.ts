/** Public API for the learn feature. Consumers should not import lib/learn directly. */
export * from './contracts'
export { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'
export {
  buildSessionPlanSuggestions,
  buildSessionPlanInstruction,
  buildSessionPlanUpdateMessage,
  formatSessionPlanLabel,
  formatSessionPlanNextStep,
  validateSessionPlan,
  sessionPlanSchema,
} from '@/lib/learn/session-plan'
export {
  clearPanel,
  fetchActivityById,
  fetchCurriculumContext,
  getPanelState,
  listChapterActivities,
  showActivity,
  showGrammar,
  showQuestion,
} from '@/lib/learn/client-tools'
export { executeTutorTool } from '@/lib/learn/execute-tutor-tool'
