import type { LearnPanelState } from '@/stores/useLearnSessionStore'
import type { TutorSessionState } from '@/lib/tutor/state'

export type SessionVisualState =
  | 'pre_session'
  | 'connecting'
  | 'active_practice'
  | 'feedback'
  | 'completed'

export type ActivityUiPhase = 'playing' | 'completed' | 'resume-prompt' | 'checking'

export type ContinuationKind = 'review' | 'resume' | 'start' | 'completed'

export interface ContinuationInfo {
  kind: ContinuationKind
  title: string
  description: string
  label: string
  href: string
}

export interface SessionUiContext {
  sessionMode: 'voice' | 'text' | null
  tutorActive: boolean
  tutorConnecting: boolean
  tutorState: TutorSessionState
  panel: LearnPanelState
  activityPhase?: ActivityUiPhase | null
  questionAnswered?: boolean
  completionScorePercent?: number | null
}

export function shouldExpandEngagementMetrics(state: SessionVisualState): boolean {
  return state === 'pre_session' || state === 'completed'
}

function panelHasPracticeContent(panel: LearnPanelState, activityPhase?: ActivityUiPhase | null): boolean {
  if (panel.kind === 'explanation' || panel.kind === 'question') return true
  if (panel.kind !== 'activity') return false
  return activityPhase === 'playing' || activityPhase === 'resume-prompt'
}

export function resolveSessionVisualState(context: SessionUiContext): SessionVisualState {
  if (context.activityPhase === 'completed') return 'completed'
  if (
    context.tutorState === 'evaluating'
    || context.tutorState === 'help'
    || context.questionAnswered
  ) {
    return 'feedback'
  }
  if (panelHasPracticeContent(context.panel, context.activityPhase)) return 'active_practice'
  if (context.tutorActive && context.panel.kind !== 'empty') return 'active_practice'
  if (context.tutorActive) return 'active_practice'
  if (context.tutorConnecting) return 'connecting'
  return 'pre_session'
}
