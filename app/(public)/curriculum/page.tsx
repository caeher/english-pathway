import Link from 'next/link'
import { ArrowRight, BookOpen, Layers } from 'lucide-react'
import { resolveAllModules } from '@/lib/content/resolve'
import { curriculumModuleHref } from '@/lib/curriculum/href'

export const metadata = {
  title: 'Curriculum — English Pathway',
  description: 'Browse English Pathway modules and chapters.',
}

export default async function CurriculumPage() {
  const modules = await resolveAllModules()
  const chapterCount = modules.reduce((count, module) => count + module.chapters.length, 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
      <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">Curriculum</p>
      <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-(--text-primary) sm:text-5xl">Choose your next chapter</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-(--text-secondary)">Explore the complete English Pathway curriculum at your own pace, then bring any chapter to your AI tutor.</p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-(--accent-soft) px-4 py-2 text-sm font-bold text-(--accent)">
        <BookOpen className="h-4 w-4" /> {modules.length} modules · {chapterCount} chapters
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.id} href={curriculumModuleHref(module.id)} className="group rounded-2xl border border-(--border-primary) bg-(--bg-card) p-6 no-underline transition-transform hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: `${module.color}22` }}>{module.icon}</div>
              <span className="text-xs font-bold uppercase tracking-wide text-(--text-muted)">Module {module.number}</span>
            </div>
            <h2 className="mt-5 font-display text-xl font-black text-(--text-primary)">{module.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{module.description}</p>
            <p className="mt-5 flex items-center gap-2 text-sm font-bold text-(--accent)"><Layers className="h-4 w-4" /> {module.chapters.length} chapters <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" /></p>
          </Link>
        ))}
      </div>
    </div>
  )
}
