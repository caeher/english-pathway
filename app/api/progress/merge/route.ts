import { NextResponse } from 'next/server'
import {
  completeChapter,
  getCurriculumProgressSnapshot,
  mergeLearningProgress,
  mergeProgressSchema,
} from '@/features/progress'
import { resolveActivityByIdValidated } from '@/features/learn'
import { resolveChapter, getChapterProgress } from '@/features/curriculum'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const payload = mergeProgressSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return NextResponse.json({ error: 'Invalid progress merge' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const activities = []
  for (const activity of payload.data.activities) {
    const resolved = resolveActivityByIdValidated(activity.activityId)
    if (!resolved || (activity.chapterId && activity.chapterId !== resolved.chapter.id)) {
      return NextResponse.json({ error: `Activity not found: ${activity.activityId}` }, { status: 400 })
    }
    activities.push({
      ...activity,
      chapterId: resolved.chapter.id,
      moduleId: resolved.module.id,
      activityType: resolved.activity.type,
    })
  }

  const chapters = []
  for (const chapter of payload.data.chapters) {
    const resolved = await resolveChapter(chapter.chapterId)
    if (!resolved || (chapter.moduleId && chapter.moduleId !== resolved.module.id)) {
      return NextResponse.json({ error: `Chapter not found: ${chapter.chapterId}` }, { status: 400 })
    }
    chapters.push({ ...chapter, moduleId: resolved.module.id })
  }

  let lastActivity: { activityId: string; chapterId: string; moduleId: string } | null = null
  if (payload.data.lastActivity) {
    const resolved = resolveActivityByIdValidated(payload.data.lastActivity.activityId)
    if (!resolved) return NextResponse.json({ error: 'Last activity not found' }, { status: 400 })
    lastActivity = {
      activityId: resolved.activity.id,
      chapterId: resolved.chapter.id,
      moduleId: resolved.module.id,
    }
  }

  try {
    const existing = await getCurriculumProgressSnapshot(supabase, user.id)
    for (const chapter of chapters.filter((item) => item.status === 'completed')) {
      const resolved = await resolveChapter(chapter.chapterId)
      if (!resolved) continue
      const candidateActivities = [
        ...existing.activities,
        ...activities
          .filter((item) => item.chapterId === resolved.chapter.id)
          .map((item) => ({
            activity_id: item.activityId,
            chapter_id: item.chapterId,
            status: item.status,
            score: item.score,
          })),
      ]
      const summary = getChapterProgress(resolved.chapter, {
        ...existing,
        activities: candidateActivities,
      })
      if (!summary.canComplete && !existing.completedChapterIds.has(resolved.chapter.id)) {
        return NextResponse.json({ error: `Complete the chapter activities before finishing: ${resolved.chapter.id}` }, { status: 409 })
      }
    }
    const result = await mergeLearningProgress(supabase, user.id, activities, chapters, lastActivity)
    for (const chapter of chapters.filter((item) => item.status === 'completed')) {
      await completeChapter(supabase, user.id, chapter.chapterId)
    }
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to merge learning progress' }, { status: 500 })
  }
}
