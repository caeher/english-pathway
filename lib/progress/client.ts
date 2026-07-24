import type { ActivityProgressInput, ChapterProgressInput } from '@/lib/api/progress-schemas'

const GUEST_PROGRESS_KEY = 'english-pathway-progress'

interface GuestProgress {
  activities: Record<string, ActivityProgressInput>
  chapters: Record<string, ChapterProgressInput>
  lastActivity: { activityId: string; chapterId?: string; moduleId?: string } | null
}

function emptyProgress(): GuestProgress {
  return { activities: {}, chapters: {}, lastActivity: null }
}

function readProgress(): GuestProgress {
  if (typeof window === 'undefined') return emptyProgress()
  try {
    const raw = window.localStorage.getItem(GUEST_PROGRESS_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<GuestProgress>
    return {
      activities: parsed.activities ?? {},
      chapters: parsed.chapters ?? {},
      lastActivity: parsed.lastActivity ?? null,
    }
  } catch {
    return emptyProgress()
  }
}

function writeProgress(progress: GuestProgress) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress))
  }
}

export function saveGuestActivityProgress(progress: ActivityProgressInput) {
  const current = readProgress()
  const existing = current.activities[progress.activityId]
  current.activities[progress.activityId] = {
    ...existing,
    ...progress,
    score: Math.max(existing?.score ?? 0, progress.score ?? 0),
    attempts: Math.max(existing?.attempts ?? 0, progress.attempts ?? 0, 1),
    status: existing?.status === 'completed' || progress.status === 'completed' ? 'completed' : progress.status,
  }
  current.lastActivity = {
    activityId: progress.activityId,
    chapterId: progress.chapterId,
    moduleId: progress.moduleId,
  }
  writeProgress(current)
}

export function saveGuestChapterProgress(progress: ChapterProgressInput) {
  const current = readProgress()
  current.chapters[progress.chapterId] = progress
  writeProgress(current)
}

export function isGuestActivityCompleted(activityId: string): boolean {
  return readProgress().activities[activityId]?.status === 'completed'
}

export async function isActivityCompleted(activityId: string): Promise<boolean> {
  if (isGuestActivityCompleted(activityId)) return true

  try {
    const response = await fetch(`/api/progress/activity?activityId=${encodeURIComponent(activityId)}`)
    if (!response.ok) return false
    const data = (await response.json()) as { completed?: boolean }
    return data.completed === true
  } catch {
    return false
  }
}

export async function saveActivityProgress(progress: ActivityProgressInput) {
  try {
    const response = await fetch('/api/progress/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    })
    if (response.ok) return true
    if (response.status === 401) {
      saveGuestActivityProgress(progress)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function saveChapterProgress(progress: ChapterProgressInput) {
  try {
    const response = await fetch('/api/progress/chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    })
    if (response.ok) return true
    if (response.status === 401) {
      saveGuestChapterProgress(progress)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function mergeGuestProgress() {
  const current = readProgress()
  const payload = {
    activities: Object.values(current.activities),
    chapters: Object.values(current.chapters),
    lastActivity: current.lastActivity,
  }
  if (payload.activities.length === 0 && payload.chapters.length === 0 && !payload.lastActivity) return false

  try {
    const response = await fetch('/api/progress/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (response.ok && typeof window !== 'undefined') window.localStorage.removeItem(GUEST_PROGRESS_KEY)
    return response.ok
  } catch {
    return false
  }
}
