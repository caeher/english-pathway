import { NextResponse } from 'next/server'
import { getLastProgress } from '@/lib/dal/learning-progress'
import { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'
import { resolveChapter } from '@/lib/content/resolve'
import { curriculumChapterHref, learnHref } from '@/lib/curriculum/href'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    const progress = await getLastProgress(supabase, user.id)
    if (!progress) return NextResponse.json({ progress: null })

    const resolvedActivity = progress.last_activity_id
      ? resolveActivityByIdValidated(progress.last_activity_id)
      : null
    const resolvedChapter = progress.last_chapter_id
      ? await resolveChapter(progress.last_chapter_id)
      : null
    const chapter = resolvedActivity?.chapter ?? resolvedChapter?.chapter
    const resolvedModule = resolvedActivity?.module ?? resolvedChapter?.module

    return NextResponse.json({
      progress: {
        ...progress,
        activityTitle: resolvedActivity?.activity.title ?? null,
        chapterTitle: chapter?.title ?? null,
        moduleTitle: resolvedModule?.title ?? null,
        curriculumUrl: resolvedModule && chapter ? curriculumChapterHref(resolvedModule.id, chapter.id) : null,
        learnUrl: resolvedModule && chapter ? learnHref({
          moduleId: resolvedModule.id,
          chapterId: chapter.id,
          activityId: resolvedActivity?.activity.id ?? null,
        }) : null,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to load learning progress' }, { status: 500 })
  }
}
