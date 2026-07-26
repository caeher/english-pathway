import type { ActivityAttemptInput, ChapterProgressInput } from '@/lib/api/progress-schemas'

const GUEST_PROGRESS_KEY = 'english-pathway-progress'

interface GuestActivityProgress extends ActivityAttemptInput {
  passed?: boolean
  status?: 'not_started' | 'in_progress' | 'completed'
}

interface GuestProgress {
  activities: Record<string, GuestActivityProgress>
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

export function saveGuestActivityProgress(progress: GuestActivityProgress) {
  const current = readProgress()
  const existing = current.activities[progress.activityId]
  current.activities[progress.activityId] = {
    ...existing,
    ...progress,
    scorePercent: Math.max(existing?.scorePercent ?? 0, progress.scorePercent ?? progress.score ?? 0),
    attempts: Math.max(existing?.attempts ?? 0, progress.attempts ?? 0, progress.finished ? 1 : 0),
    passed: existing?.passed === true || progress.passed === true,
    status: existing?.status === 'completed' || progress.finished ? 'completed' : progress.status ?? 'in_progress',
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
  return readProgress().activities[activityId]?.passed === true
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

export async function saveActivityAttempt(progress: ActivityAttemptInput & { passed?: boolean }) {
  const passed = progress.passed === true
  try {
    const response = await fetch('/api/progress/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    })
    if (response.ok) {
      const data = (await response.json()) as { passed?: boolean }
      return { ok: true as const, passed: data.passed === true }
    }
    if (response.status === 401) {
      saveGuestActivityProgress({ ...progress, passed })
      return { ok: true as const, passed }
    }
    return { ok: false as const, passed: false }
  } catch {
    return { ok: false as const, passed: false }
  }
}

/** @deprecated Use saveActivityAttempt */
export async function saveActivityProgress(progress: GuestActivityProgress) {
  const result = await saveActivityAttempt({
    activityId: progress.activityId,
    finished: progress.finished ?? progress.status === 'completed',
    score: progress.score,
    total: progress.total,
    scorePercent: progress.scorePercent ?? progress.score,
    attempts: progress.attempts,
    activityType: progress.activityType,
    chapterId: progress.chapterId,
    moduleId: progress.moduleId,
    passed: progress.passed,
  })
  return result.ok
}

export async function saveChapterProgress(progress: ChapterProgressInput) {
  if (progress.status === 'completed') return false
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
    activities: Object.values(current.activities).map((activity) => ({
      activityId: activity.activityId,
      finished: activity.finished ?? activity.status === 'completed',
      score: activity.score,
      total: activity.total,
      scorePercent: activity.scorePercent ?? activity.score,
      attempts: activity.attempts,
      activityType: activity.activityType,
      chapterId: activity.chapterId,
      moduleId: activity.moduleId,
      passed: activity.passed,
    })),
    chapters: Object.values(current.chapters).filter((chapter) => chapter.status !== 'completed'),
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
