import { NextResponse } from 'next/server'
import { activityProgressSchema } from '@/lib/api/progress-schemas'
import { recordActivityProgress } from '@/lib/dal/learning-progress'
import { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const payload = activityProgressSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return NextResponse.json({ error: 'Invalid activity progress' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const resolved = resolveActivityByIdValidated(payload.data.activityId)
  if (!resolved || (payload.data.chapterId && payload.data.chapterId !== resolved.chapter.id)) {
    return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
  }

  try {
    const progress = await recordActivityProgress(supabase, user.id, {
      ...payload.data,
      chapterId: resolved.chapter.id,
      moduleId: resolved.module.id,
      activityType: resolved.activity.type,
    })
    return NextResponse.json({ ok: true, progress })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to save activity progress' }, { status: 500 })
  }
}
