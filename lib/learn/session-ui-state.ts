import { buildCompletionSummary, correctnessFromPercent } from '@/lib/learn/activity-completion'
import { getTutorStateLabel } from '@/lib/learn/tutor-state-label'
import type { TutorSessionState } from '@/lib/tutor/state'
import type { LearnPanelState } from '@/stores/useLearnSessionStore'

export type SessionVisualState =
  | 'pre_session'
  | 'connecting'
  | 'active_practice'
  | 'feedback'
  | 'completed'

export type ActivityUiPhase = 'playing' | 'completed' | 'resume-prompt' | 'checking'

export type SessionModeLabel = 'Voice' | 'Text' | 'Not started'

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
  continuation?: ContinuationInfo | null
  completionScorePercent?: number | null
}

export interface SessionUiSnapshot {
  state: SessionVisualState
  modeLabel: SessionModeLabel
  objectiveLabel: string
  nextActionLabel: string
  statusDetail?: string
  stateBadgeLabel: string
}

const STATE_BADGE_LABELS: Record<SessionVisualState, string> = {
  pre_session: 'Ready',
  connecting: 'Connecting',
  active_practice: 'Practice',
  feedback: 'Feedback',
  completed: 'Complete',
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

function resolveModeLabel(context: SessionUiContext): SessionModeLabel {
  if (!context.tutorActive && !context.tutorConnecting) return 'Not started'
  if (context.sessionMode === 'voice') return 'Voice'
  if (context.sessionMode === 'text') return 'Text'
  return 'Not started'
}

function resolveObjectiveLabel(context: SessionUiContext, state: SessionVisualState): string {
  const { panel, continuation } = context

  if (panel.kind === 'activity') return panel.activity.title
  if (panel.kind === 'explanation') return panel.title ?? 'Lesson'
  if (panel.kind === 'question') return 'Quick check'

  if (state === 'pre_session' && continuation) return continuation.title
  if (state === 'completed') return 'Activity finished'

  return 'English practice session'
}

function resolveNextActionLabel(context: SessionUiContext, state: SessionVisualState): string {
  const { panel, continuation, completionScorePercent, tutorState } = context

  if (state === 'completed') {
    const scorePercent = completionScorePercent ?? 0
    const summary = buildCompletionSummary({
      score: scorePercent,
      total: 100,
      scorePercent,
      correctness: correctnessFromPercent(scorePercent),
      nextAction: scorePercent >= 70 ? 'continue' : 'retry',
      weakItemIndexes: [],
      metrics: {},
    })
    if (summary.primaryAction === 'continue') return 'Continue to the next activity'
    if (summary.primaryAction === 'review') return 'Review weak items'
    return 'Try again'
  }

  if (state === 'feedback') {
    const tutorLabel = getTutorStateLabel(tutorState)
    if (tutorLabel) return `Follow tutor guidance: ${tutorLabel}`
    if (context.questionAnswered) return 'Review the answer feedback'
    return 'Review your response'
  }

  if (state === 'connecting') return 'Wait while your tutor connects'

  if (state === 'active_practice') {
    if (context.activityPhase === 'resume-prompt') return 'Resume or restart the activity'
    if (panel.kind === 'activity') return 'Complete the activity'
    if (panel.kind === 'explanation') return 'Read the lesson and practise'
    if (panel.kind === 'question') return 'Answer the quick check'
    return 'Follow your tutor and practise'
  }

  if (continuation) return continuation.label
  return 'Start your session'
}

function resolveStatusDetail(context: SessionUiContext, state: SessionVisualState): string | undefined {
  if (state === 'completed' && context.completionScorePercent != null) {
    return `Score: ${context.completionScorePercent}%`
  }
  if (state === 'pre_session' && context.continuation) return context.continuation.description
  if (state === 'active_practice' && context.panel.kind === 'activity' && context.panel.activity.description) {
    return context.panel.activity.description
  }
  return undefined
}

export function resolveSessionUiState(context: SessionUiContext): SessionUiSnapshot {
  const state = resolveSessionVisualState(context)

  return {
    state,
    modeLabel: resolveModeLabel(context),
    objectiveLabel: resolveObjectiveLabel(context, state),
    nextActionLabel: resolveNextActionLabel(context, state),
    statusDetail: resolveStatusDetail(context, state),
    stateBadgeLabel: STATE_BADGE_LABELS[state],
  }
}
