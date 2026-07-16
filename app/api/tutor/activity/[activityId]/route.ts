import { NextResponse } from 'next/server'
import { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'

export async function GET(
  _request: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  const { activityId } = await context.params
  const resolved = resolveActivityByIdValidated(activityId)

  if (!resolved) {
    return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
  }

  return NextResponse.json({
    activity: resolved.activity,
    chapterId: resolved.chapter.id,
    moduleId: resolved.module.id,
  })
}
