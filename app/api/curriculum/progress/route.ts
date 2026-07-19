import { NextResponse } from 'next/server'
import { completeChapterSchema } from '@/lib/api/curriculum-schemas'
import { completeChapter, getCurriculumProgressSnapshot, recordChapterProgress } from '@/features/progress'
import { resolveAllModules, resolveChapter } from '@/lib/content/resolve'
import { getChapterProgress, getLearningTarget, getModuleProgress } from '@/lib/curriculum/progress'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ authenticated: false, modules: [], resume: null })

  try {
    const modules = await resolveAllModules()
    const snapshot = await getCurriculumProgressSnapshot(supabase, user.id)
    return NextResponse.json({
      authenticated: true,
      modules: modules.map((curriculumModule) => getModuleProgress(curriculumModule, snapshot)),
      resume: getLearningTarget(modules, snapshot),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to load curriculum progress' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const payload = completeChapterSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return NextResponse.json({ error: 'Invalid completion request' }, { status: 400 })

  const resolved = await resolveChapter(payload.data.chapterId)
  if (!resolved) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    const snapshot = await getCurriculumProgressSnapshot(supabase, user.id)
    const summary = getChapterProgress(resolved.chapter, snapshot)
    if (!summary.canComplete && !snapshot.completedChapterIds.has(resolved.chapter.id)) {
      return NextResponse.json({ error: 'Complete the chapter activities before finishing this chapter.' }, { status: 409 })
    }
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
