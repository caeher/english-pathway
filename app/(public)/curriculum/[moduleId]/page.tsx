import Link from 'next/link'
import { CheckCircle2, ChevronRight, Circle, ListChecks } from 'lucide-react'
import { notFound } from 'next/navigation'
import { resolveModule } from '@/lib/content/resolve'
import { curriculumChapterHref, curriculumModuleHref, learnHref } from '@/lib/curriculum/href'
import { getChapterProgress, type CurriculumProgressSnapshot } from '@/lib/curriculum/progress'
import { getCurriculumProgressSnapshot } from '@/features/progress'
import { createClient } from '@/lib/supabase/server'

export default async function ModuleCurriculumPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params
  const curriculumModule = await resolveModule(moduleId)
  if (!curriculumModule) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const snapshot: CurriculumProgressSnapshot = user
    ? await getCurriculumProgressSnapshot(supabase, user.id)
    : { completedChapterIds: new Set(), activities: [], lastChapterId: null, lastActivityId: null }
  const chapterProgress = curriculumModule.chapters.map((chapter) => getChapterProgress(chapter, snapshot))
  const completedCount = chapterProgress.filter((chapter) => chapter.status === 'completed').length
  const next = chapterProgress.find((chapter) => chapter.status !== 'completed')
  const nextChapter = next ? curriculumModule.chapters.find((chapter) => chapter.id === next.chapterId) : null

  return (
    <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
      <Link href="/curriculum" className="text-sm font-bold text-(--accent) no-underline">← All modules</Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">Module {curriculumModule.number}</p>
          <h1 className="mt-2 font-display text-4xl font-black text-(--text-primary)"><span className="mr-3">{curriculumModule.icon}</span>{curriculumModule.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-(--text-secondary)">{curriculumModule.description}</p>
        </div>
        {user ? <div className="rounded-xl bg-(--success-soft) px-4 py-3 text-sm font-bold text-(--success)"><CheckCircle2 className="mr-2 inline h-4 w-4" />{completedCount} of {curriculumModule.chapters.length} completed</div> : <Link href={`/login?redirectTo=${encodeURIComponent(curriculumModuleHref(curriculumModule.id))}`} className="text-sm font-bold text-(--accent) hover:underline">Sign in to save progress</Link>}
      </div>

      {nextChapter && <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-(--accent)/30 bg-(--accent-soft) p-5"><div><p className="text-xs font-bold uppercase tracking-wide text-(--accent)">{user ? 'Next up' : 'Start here'}</p><p className="mt-1 font-display font-black text-(--text-primary)">{nextChapter.title}</p></div><Link href={learnHref({ moduleId: curriculumModule.id, chapterId: nextChapter.id, activityId: next?.nextActivityId })} className="inline-flex items-center gap-2 rounded-xl bg-(--accent) px-4 py-2 text-sm font-bold text-white no-underline">Practice in Learn <ChevronRight className="h-4 w-4" /></Link></div>}

      <ol className="mt-10 space-y-3">
        {curriculumModule.chapters.map((chapter, index) => {
          const progress = chapterProgress[index]
          const completed = progress.status === 'completed'
          return (
            <li key={chapter.id}>
              <Link href={curriculumChapterHref(curriculumModule.id, chapter.id)} className="group flex items-center gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 no-underline transition-colors hover:border-(--accent)/60">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-black ${completed ? 'bg-(--success) text-white' : 'bg-(--bg-tertiary) text-(--text-primary)'}`}>{completed ? <CheckCircle2 className="h-5 w-5" /> : progress.status === 'in_progress' ? <Circle className="h-5 w-5 text-(--accent)" /> : chapter.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-bold text-(--text-primary)">{chapter.title}</span>
                  <span className="mt-1 block text-sm text-(--text-secondary)">{chapter.subtitle} · {chapter.activities.length} activities</span>
                  {user && <span className="mt-2 block text-xs font-bold text-(--text-muted)">{progress.completedActivities}/{progress.totalActivities} activities · {progress.completionPercent}%</span>}
                </span>
                {completed ? <span className="hidden text-xs font-bold text-(--success) sm:block">Completed</span> : progress.status === 'in_progress' ? <ListChecks className="hidden h-4 w-4 text-(--accent) sm:block" /> : null}
                <ChevronRight className="h-5 w-5 shrink-0 text-(--text-muted) transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
