import Link from 'next/link'
import { BookOpen, GraduationCap, MessageCircle, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'How It Works — English Pathway',
  description: 'Learn how English Pathway helps you practice English with an AI tutor and interactive activities.',
}

const STEPS = [
  { icon: MessageCircle, title: 'Talk with your tutor', desc: 'Start a voice or text session with the AI English tutor.' },
  { icon: BookOpen, title: 'Learn with context', desc: 'Grammar explanations and lesson content appear alongside the conversation.' },
  { icon: Sparkles, title: 'Practice interactively', desc: 'Quizzes, flashcards, and games launch when you are ready to practice.' },
  { icon: GraduationCap, title: 'Create an account', desc: 'Sign up to manage your profile and settings.' },
]

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display font-black text-4xl text-(--text-primary) mb-4">How it works</h1>
      <p className="text-(--text-secondary) text-lg mb-12">
        English Pathway pairs an AI tutor with a structured curriculum and interactive practice activities.
      </p>
      <div className="space-y-6 mb-12">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-4 p-5 rounded-2xl border border-(--border-primary) bg-(--bg-card)">
            <div className="w-10 h-10 rounded-xl bg-(--accent-soft) flex items-center justify-center shrink-0">
              <step.icon className="w-5 h-5 text-(--accent)" />
            </div>
            <div>
              <p className="text-xs font-bold text-(--text-muted) mb-1">Step {i + 1}</p>
              <h2 className="font-display font-bold text-(--text-primary)">{step.title}</h2>
              <p className="text-sm text-(--text-secondary) mt-1">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/learn"
        className="inline-flex px-6 py-3 rounded-xl bg-(--accent) text-white font-display font-bold no-underline hover:bg-(--accent-hover) transition-colors"
      >
        Start learning →
      </Link>
    </div>
  )
}
