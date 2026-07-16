import { useLearnSessionStore } from '@/stores/useLearnSessionStore'
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
  useLearnSessionStore.getState().setGrammar(markdown, title)
}

export async function showActivity(activityId: string) {
  const data = await fetchActivityById(activityId)
  useLearnSessionStore.getState().setActivity(data.activity, data.chapterId, data.moduleId)
  return { success: true, title: data.activity.title }
}

export function showQuestion(prompt: string, options?: string[], correctIndex?: number) {
  useLearnSessionStore.getState().setQuestion(prompt, options, correctIndex)
}

export function clearPanel() {
  useLearnSessionStore.getState().clearPanel()
}
