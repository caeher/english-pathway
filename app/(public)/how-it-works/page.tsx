import Link from 'next/link'
import { BookOpen, GraduationCap, MessageCircle, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'How It Works — English Pathway',
  description: 'Learn how English Pathway combines an AI tutor, a structured curriculum, and interactive practice.',
}

const STEPS = [
  { icon: MessageCircle, title: 'Talk with your tutor', desc: 'Start a voice or text session with the AI English tutor.' },
  { icon: BookOpen, title: 'Learn with context', desc: 'Grammar explanations and lesson content appear alongside the conversation.' },
  { icon: Sparkles, title: 'Practice interactively', desc: 'Quizzes, flashcards, and games launch when you are ready to practice.' },
  { icon: GraduationCap, title: 'Build a habit', desc: 'Keep your next lesson close and continue at a pace that fits your day.' },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">How it works</p>
      <h1 className="mt-3 font-display text-4xl font-black text-(--text-primary)">A simple path to more confident English.</h1>
      <p className="mt-4 text-lg text-(--text-secondary)">
        English Pathway pairs an AI tutor with a structured curriculum and interactive practice activities.
      </p>
      <div className="mb-12 mt-12 space-y-6">
        {STEPS.map((step, i) => (
          <article key={step.title} className="flex gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--accent-soft)">
              <step.icon className="h-5 w-5 text-(--accent)" aria-hidden="true" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-(--text-muted)">Step {i + 1}</p>
              <h2 className="font-display font-bold text-(--text-primary)">{step.title}</h2>
              <p className="mt-1 text-sm text-(--text-secondary)">{step.desc}</p>
            </div>
          </article>
        ))}
      </div>
      <Link href="/learn" className="inline-flex rounded-xl bg-(--accent) px-6 py-3 font-display font-bold text-white no-underline transition-colors hover:bg-(--accent-hover)">
        Start learning <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
