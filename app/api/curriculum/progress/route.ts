import { NextResponse } from 'next/server'
import { completeChapterSchema } from '@/lib/api/curriculum-schemas'
import { completeChapter } from '@/lib/dal/chapter-completions'
import { recordChapterProgress } from '@/lib/dal/learning-progress'
import { resolveChapter } from '@/lib/content/resolve'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const payload = completeChapterSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return NextResponse.json({ error: 'Invalid completion request' }, { status: 400 })

  const resolved = await resolveChapter(payload.data.chapterId)
  if (!resolved) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    await recordChapterProgress(supabase, user.id, {
      chapterId: resolved.chapter.id,
      moduleId: resolved.module.id,
      status: 'completed',
    })
    const completion = await completeChapter(supabase, user.id, resolved.chapter.id)
    return NextResponse.json({ ok: true, completion })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to save chapter completion' }, { status: 500 })
  }
}
