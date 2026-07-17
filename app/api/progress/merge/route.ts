import { NextResponse } from 'next/server'
import { mergeProgressSchema } from '@/lib/api/progress-schemas'
import { mergeLearningProgress } from '@/lib/dal/learning-progress'
import { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'
import { resolveChapter } from '@/lib/content/resolve'
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
    const result = await mergeLearningProgress(supabase, user.id, activities, chapters, lastActivity)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to merge learning progress' }, { status: 500 })
  }
}
