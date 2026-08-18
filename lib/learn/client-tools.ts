import { learnSessionActions, useLearnSessionStore } from '@/stores/useLearnSessionStore'
import { curriculumChapterHref } from '@/lib/curriculum/href'
import type { PanelBlock } from '@/lib/tutor/panel-content'
import type { ChapterActivity } from '@/types'
import type { ActivityRoundMetadata, SliceRoundOptions } from '@/features/activities/sizing'

export interface FetchActivityOptions extends SliceRoundOptions {}

export interface ShowActivityOptions extends SliceRoundOptions {
  context?: string
  expectedAction?: string
}

export async function fetchCurriculumContext(params: {
  query: string
  moduleId?: string
  chapterId?: string
  matchCount?: number
}): Promise<{ content: string; metadata: Record<string, unknown>; similarity: number }[]> {
  const res = await fetch('/api/tutor/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to fetch curriculum context')
  }
  const data = (await res.json()) as { matches: Array<{ content: string; metadata: Record<string, unknown>; similarity: number }> }
  return data.matches
}

export async function fetchActivityById(
  activityId: string,
  options?: FetchActivityOptions,
): Promise<{
  activity: ChapterActivity
  chapterId: string
  moduleId: string
  roundMeta?: ActivityRoundMetadata
}> {
  const url = new URL(`/api/tutor/activity/${encodeURIComponent(activityId)}`, window.location.origin)
  if (options?.roundIndex !== undefined) url.searchParams.set('round', String(options.roundIndex))
  if (options?.offset !== undefined) url.searchParams.set('offset', String(options.offset))
  if (options?.limit !== undefined) url.searchParams.set('limit', String(options.limit))
  if (options?.prioritizeItemIndexes && options.prioritizeItemIndexes.length > 0) {
    url.searchParams.set('weakItems', options.prioritizeItemIndexes.join(','))
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error('Activity not found')
  }
  return res.json()
}

export function getPanelConflictReason(
  action: 'showActivity' | 'showGrammar' | 'showQuestion' | 'clearPanel',
): string | null {
  const { tutorState } = useLearnSessionStore.getState()
  if (action === 'showActivity') {
    if (tutorState === 'explaining') {
      return 'An instructional explanation is currently active in the panel. Complete your spoken explanation, invite learner questions or check readiness, and call clearPanel before presenting an activity.'
    }
    if (tutorState === 'activity_presented') {
      return 'An activity is already active in the learning panel. Wait for the learner to complete, skip, or close it.'
    }
  }
  if (action === 'showGrammar') {
    if (tutorState === 'activity_presented') {
      return 'Grammar explanation cannot be shown while an interactive activity is active. Wait for the learner to complete, skip, or close the activity first.'
    }
  }
  if (action === 'showQuestion') {
    if (tutorState === 'activity_presented') {
      return 'Quick check question cannot be shown while an interactive activity is active. Wait for the learner to complete, skip, or close the activity first.'
    }
  }
  if (action === 'clearPanel') {
    if (tutorState === 'evaluating') {
      return 'Panel cannot be cleared while evaluating an activity result. Provide feedback first.'
    }
    if (tutorState === 'activity_presented') {
      return 'Panel cannot be cleared while an activity is in progress. The learner must complete, skip, or close the activity.'
    }
  }
  return null
}

export function showGrammar(blocks: PanelBlock[], title?: string) {
  const conflict = getPanelConflictReason('showGrammar')
  if (conflict) {
    throw new Error(conflict)
  }
  learnSessionActions.setExplanation(blocks, title)
}

export async function showActivity(
  activityId: string,
  options?: ShowActivityOptions,
) {
  const conflict = getPanelConflictReason('showActivity')
  if (conflict) {
    throw new Error(conflict)
  }
  const data = await fetchActivityById(activityId, options)
  learnSessionActions.setActivity(data.activity, data.chapterId, data.moduleId, options)
  return {
    success: true,
    title: data.activity.title,
    curriculumUrl: curriculumChapterHref(data.moduleId, data.chapterId),
    context: options?.context,
    expectedAction: options?.expectedAction,
    roundMeta: data.roundMeta,
  }
}

export function showQuestion(prompt: string, options?: string[], correctIndex?: number) {
  const conflict = getPanelConflictReason('showQuestion')
  if (conflict) {
    throw new Error(conflict)
  }
  learnSessionActions.setQuestion(prompt, options, correctIndex)
}

export function clearPanel() {
  const conflict = getPanelConflictReason('clearPanel')
  if (conflict) {
    throw new Error(conflict)
  }
  learnSessionActions.clearPanel()
}

export async function listChapterActivities(chapterId: string): Promise<{
  chapterId: string
  chapterTitle: string
  moduleId: string
  activities: Array<{ id: string; type: string; title: string; description: string }>
}> {
  const res = await fetch(`/api/tutor/chapter/${encodeURIComponent(chapterId)}/activities`)
  if (!res.ok) {
    throw new Error('Chapter not found')
  }
  return res.json()
}

export function getPanelState() {
  const state = useLearnSessionStore.getState()
  const panel = state.panel
  return {
    panelKind: panel.kind,
    activityId: panel.kind === 'activity' ? panel.activity.id : undefined,
    activityType: panel.kind === 'activity' ? panel.activity.type : undefined,
    activityTitle: panel.kind === 'activity' ? panel.activity.title : undefined,
    activityContext: panel.kind === 'activity' ? panel.context : undefined,
    expectedAction: panel.kind === 'activity' ? panel.expectedAction : undefined,
    explanationTitle: panel.kind === 'explanation' ? panel.title : undefined,
    blockCount: panel.kind === 'explanation' ? panel.blocks.length : undefined,
    questionPrompt: panel.kind === 'question' ? panel.prompt : undefined,
    panelNotice: state.panelNotice,
    lastActivityResult: state.lastActivityResult,
    lastActivityOutcome: state.lastActivityOutcome,
    tutorState: state.tutorState,
  }
}
