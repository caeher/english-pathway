import { learnSessionActions, useLearnSessionStore } from '@/stores/useLearnSessionStore'
import { curriculumChapterHref } from '@/lib/curriculum/href'
import type { ChapterActivity } from '@/types'

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

export async function fetchActivityById(activityId: string): Promise<{
  activity: ChapterActivity
  chapterId: string
  moduleId: string
}> {
  const res = await fetch(`/api/tutor/activity/${encodeURIComponent(activityId)}`)
  if (!res.ok) {
    throw new Error('Activity not found')
  }
  return res.json()
}

export function showGrammar(markdown: string, title?: string) {
  learnSessionActions.setGrammar(markdown, title)
}

export async function showActivity(activityId: string) {
  const data = await fetchActivityById(activityId)
  learnSessionActions.setActivity(data.activity, data.chapterId, data.moduleId)
  return {
    success: true,
    title: data.activity.title,
    curriculumUrl: curriculumChapterHref(data.moduleId, data.chapterId),
  }
}

export function showQuestion(prompt: string, options?: string[], correctIndex?: number) {
  learnSessionActions.setQuestion(prompt, options, correctIndex)
}

export function clearPanel() {
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
    grammarTitle: panel.kind === 'grammar' ? panel.title : undefined,
    questionPrompt: panel.kind === 'question' ? panel.prompt : undefined,
    lastActivityResult: state.lastActivityResult,
    tutorState: state.tutorState,
  }
}
