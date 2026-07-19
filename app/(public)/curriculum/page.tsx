import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Layers } from 'lucide-react'
import { resolveAllModules } from '@/lib/content/resolve'
import { curriculumModuleHref, learnHref } from '@/lib/curriculum/href'
import { getModuleProgress, getLearningTarget } from '@/lib/curriculum/progress'
import { getCurriculumProgressSnapshot } from '@/features/progress/server'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Curriculum - English Pathway',
  description: 'Browse English Pathway modules and chapters.',
}

export default async function CurriculumPage() {
  const modules = await resolveAllModules()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const snapshot = user
    ? await getCurriculumProgressSnapshot(supabase, user.id)
    : { completedChapterIds: new Set<string>(), activities: [], lastChapterId: null, lastActivityId: null }
  const progress = modules.map((curriculumModule) => getModuleProgress(curriculumModule, snapshot))
  const chapterCount = modules.reduce((count, curriculumModule) => count + curriculumModule.chapters.length, 0)
  const completedCount = progress.reduce((count, item) => count + item.completedChapters, 0)
  const resume = user ? getLearningTarget(modules, snapshot) : null

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
      <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">Curriculum</p>
      <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-(--text-primary) sm:text-5xl">Choose your next chapter</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-(--text-secondary)">Follow the pathway at your own pace, then bring any chapter to your AI tutor.</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-xl bg-(--accent-soft) px-4 py-2 text-sm font-bold text-(--accent)">
          <BookOpen className="h-4 w-4" aria-hidden="true" /> {modules.length} modules · {chapterCount} chapters
        </span>
        {user ? <span className="inline-flex items-center gap-2 rounded-xl bg-(--success-soft) px-4 py-2 text-sm font-bold text-(--success)">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {completedCount}/{chapterCount} chapters completed
        </span> : <Link href="/login?redirectTo=%2Fcurriculum" className="text-sm font-bold text-(--accent) hover:underline">Sign in to save progress</Link>}
        {resume && <Link href={learnHref(resume)} className="inline-flex items-center gap-2 rounded-xl bg-(--accent) px-4 py-2 text-sm font-bold text-white no-underline hover:bg-(--accent-hover)">Continue learning <ArrowRight className="h-4 w-4" /></Link>}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((curriculumModule, index) => {
          const moduleProgress = progress[index]
          const nextChapter = moduleProgress.chapters.find((chapter) => chapter.status !== 'completed')
          return (
            <Link key={curriculumModule.id} href={curriculumModuleHref(curriculumModule.id)} className="group rounded-2xl border border-(--border-primary) bg-(--bg-card) p-6 no-underline transition-transform hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: `${curriculumModule.color}22` }}>{curriculumModule.icon}</div>
                <span className="text-xs font-bold uppercase tracking-wide text-(--text-muted)">Module {curriculumModule.number}</span>
              </div>
              <h2 className="mt-5 font-display text-xl font-black text-(--text-primary)">{curriculumModule.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{curriculumModule.description}</p>
              <div className="mt-5 flex items-center justify-between text-sm font-bold text-(--accent)">
                <span className="flex items-center gap-2"><Layers className="h-4 w-4" aria-hidden="true" /> {curriculumModule.chapters.length} chapters</span>
                {user && <span>{moduleProgress.completedChapters}/{moduleProgress.totalChapters}</span>}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
              {user && nextChapter && <p className="mt-3 text-xs text-(--text-muted)">Next: {curriculumModule.chapters.find((chapter) => chapter.id === nextChapter.chapterId)?.title}</p>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
