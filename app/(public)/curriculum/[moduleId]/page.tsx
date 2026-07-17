import Link from 'next/link'
import { CheckCircle2, ChevronRight, ListChecks } from 'lucide-react'
import { notFound } from 'next/navigation'
import { resolveModule } from '@/lib/content/resolve'
import { curriculumChapterHref } from '@/lib/curriculum/href'
import { getCompletedChapterIds } from '@/lib/dal/chapter-completions'
import { createClient } from '@/lib/supabase/server'

export default async function ModuleCurriculumPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params
  const curriculumModule = await resolveModule(moduleId)
  if (!curriculumModule) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const completedChapterIds = user ? await getCompletedChapterIds(supabase, user.id) : new Set<string>()
  const completedCount = curriculumModule.chapters.filter((chapter) => completedChapterIds.has(chapter.id)).length

  return (
    <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
      <Link href="/curriculum" className="text-sm font-bold text-(--accent) no-underline">← All modules</Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">Module {curriculumModule.number}</p>
          <h1 className="mt-2 font-display text-4xl font-black text-(--text-primary)"><span className="mr-3">{curriculumModule.icon}</span>{curriculumModule.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-(--text-secondary)">{curriculumModule.description}</p>
        </div>
        {user && <div className="rounded-xl bg-(--success-soft) px-4 py-3 text-sm font-bold text-(--success)"><CheckCircle2 className="mr-2 inline h-4 w-4" />{completedCount} of {curriculumModule.chapters.length} completed</div>}
      </div>

      <ol className="mt-10 space-y-3">
        {curriculumModule.chapters.map((chapter) => {
          const completed = completedChapterIds.has(chapter.id)
          return (
            <li key={chapter.id}>
              <Link href={curriculumChapterHref(curriculumModule.id, chapter.id)} className="group flex items-center gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 no-underline transition-colors hover:border-(--accent)/60">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-black ${completed ? 'bg-(--success) text-white' : 'bg-(--bg-tertiary) text-(--text-primary)'}`}>{completed ? <CheckCircle2 className="h-5 w-5" /> : chapter.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-bold text-(--text-primary)">{chapter.title}</span>
                  <span className="mt-1 block text-sm text-(--text-secondary)">{chapter.subtitle} · {chapter.activities.length} activities</span>
                </span>
                {completed ? <span className="hidden text-xs font-bold text-(--success) sm:block">Completed</span> : <ListChecks className="hidden h-4 w-4 text-(--text-muted) sm:block" />}
                <ChevronRight className="h-5 w-5 shrink-0 text-(--text-muted) transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
