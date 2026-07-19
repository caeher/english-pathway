import { NextResponse } from 'next/server'
import {
  chapterProgressSchema,
  completeChapter,
  getCurriculumProgressSnapshot,
  recordChapterProgress,
} from '@/features/progress'
import { resolveChapter, getChapterProgress } from '@/features/curriculum'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const payload = chapterProgressSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return NextResponse.json({ error: 'Invalid chapter progress' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const resolved = await resolveChapter(payload.data.chapterId)
  if (!resolved || (payload.data.moduleId && payload.data.moduleId !== resolved.module.id)) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  try {
    if (payload.data.status === 'completed') {
      const snapshot = await getCurriculumProgressSnapshot(supabase, user.id)
      const summary = getChapterProgress(resolved.chapter, snapshot)
      if (!summary.canComplete && !snapshot.completedChapterIds.has(resolved.chapter.id)) {
        return NextResponse.json({ error: 'Complete the chapter activities before finishing this chapter.' }, { status: 409 })
      }
    }
    const progress = await recordChapterProgress(supabase, user.id, {
      ...payload.data,
      moduleId: resolved.module.id,
    })
    if (payload.data.status === 'completed') {
      await completeChapter(supabase, user.id, resolved.chapter.id)
    }
    return NextResponse.json({ ok: true, progress })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to save chapter progress' }, { status: 500 })
  }
}
