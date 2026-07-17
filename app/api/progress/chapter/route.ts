import { NextResponse } from 'next/server'
import { chapterProgressSchema } from '@/lib/api/progress-schemas'
import { recordChapterProgress } from '@/lib/dal/learning-progress'
import { completeChapter } from '@/lib/dal/chapter-completions'
import { resolveChapter } from '@/lib/content/resolve'
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
