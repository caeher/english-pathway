import Link from 'next/link'
import { BookOpen, CheckCircle2, Headphones, ListChecks } from 'lucide-react'
import { notFound } from 'next/navigation'
import { CompleteChapterButton } from '@/components/curriculum/CompleteChapterButton'
import { MarkdownWithTts } from '@/components/lesson/MarkdownWithTts'
import { resolveModule } from '@/lib/content/resolve'
import { extractMarkdownHeadings } from '@/lib/content/markdown'
import { getCompletedChapterIds } from '@/lib/dal/chapter-completions'
import { createClient } from '@/lib/supabase/server'

export default async function ChapterCurriculumPage({ params }: { params: Promise<{ moduleId: string; chapterId: string }> }) {
  const { moduleId, chapterId } = await params
  const curriculumModule = await resolveModule(moduleId)
  const chapter = curriculumModule?.chapters.find((candidate) => candidate.id === chapterId)
  if (!curriculumModule || !chapter) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const completed = user ? (await getCompletedChapterIds(supabase, user.id)).has(chapter.id) : false
  const headings = extractMarkdownHeadings(chapter.content).filter((heading) => heading.level >= 2)

  return (
    <div id="chapter-top" className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
      <Link href={`/curriculum/${curriculumModule.id}`} className="text-sm font-bold text-(--accent) no-underline">← {curriculumModule.title}</Link>
      <header className="mt-7 rounded-3xl border border-(--border-primary) bg-(--bg-card) p-7 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">Chapter {chapter.number}</p>
            <h1 className="mt-3 font-display text-4xl font-black text-(--text-primary)"><span className="mr-3">{chapter.icon}</span>{chapter.title}</h1>
            <p className="mt-3 text-lg text-(--text-secondary)">{chapter.subtitle}</p>
          </div>
          {completed && <span className="inline-flex items-center gap-2 rounded-xl bg-(--success-soft) px-3 py-2 text-sm font-bold text-(--success)"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Completed</span>}
        </div>
        <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold text-(--text-secondary)"><span className="inline-flex items-center gap-2 rounded-lg bg-(--bg-tertiary) px-3 py-2"><ListChecks className="h-4 w-4 text-(--accent)" aria-hidden="true" /> {chapter.activities.length} activities</span><span className="inline-flex items-center gap-2 rounded-lg bg-(--bg-tertiary) px-3 py-2"><Headphones className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Use speaker buttons to hear highlighted phrases</span></div>
        {user ? <div className="mt-7"><CompleteChapterButton chapterId={chapter.id} initialCompleted={completed} /></div> : <p className="mt-7 text-sm text-(--text-secondary)"><Link href="/login?redirectTo=/curriculum" className="font-bold text-(--accent)">Sign in</Link> to save your completion.</p>}
      </header>

      {chapter.objectives.length > 0 && <section className="mt-8 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-6"><h2 className="flex items-center gap-2 font-display text-xl font-black text-(--text-primary)"><BookOpen className="h-5 w-5 text-(--accent)" aria-hidden="true" /> What you will learn</h2><ul className="mt-4 space-y-2 text-(--text-secondary)">{chapter.objectives.map((objective) => <li key={objective}>• {objective}</li>)}</ul></section>}
      {headings.length > 1 && <nav aria-label="Chapter contents" className="mt-8 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-6"><h2 className="font-display text-lg font-black text-(--text-primary)">In this chapter</h2><ol className="mt-3 space-y-2 text-sm">{headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? 'pl-4' : undefined}><a href={`#${heading.id}`} className="font-bold text-(--accent) underline-offset-4 hover:underline">{heading.text}</a></li>)}</ol></nav>}
      <article className="markdown-article mt-8 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-6 sm:p-10"><MarkdownWithTts content={chapter.content} /></article>
      <div className="mt-6 text-right"><a href="#chapter-top" className="text-sm font-bold text-(--accent) hover:underline">Back to top</a></div>
    </div>
  )
}
