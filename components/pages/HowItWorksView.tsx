'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, GraduationCap, MessageCircle, Sparkles, ArrowRight } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/motion/system'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

const STEPS = [
  { icon: MessageCircle, title: 'Talk with your tutor', desc: 'Start a voice or text session with the AI English tutor.' },
  { icon: BookOpen, title: 'Learn with context', desc: 'Grammar explanations and lesson content appear alongside the conversation.' },
  { icon: Sparkles, title: 'Practice interactively', desc: 'Quizzes, flashcards, and games launch when you are ready to practice.' },
  { icon: GraduationCap, title: 'Build a habit', desc: 'Keep your next lesson close and continue at a pace that fits your day.' },
]

export default function HowItWorksView() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <motion.div
        initial={reducedMotion ? undefined : 'initial'}
        animate={reducedMotion ? undefined : 'animate'}
        variants={fadeInUp}
      >
        <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">How it works</p>
        <h1 className="mt-3 font-display text-4xl font-black text-(--text-primary)">A simple path to more confident English.</h1>
        <p className="mt-4 text-lg text-(--text-secondary)">
          English Pathway pairs an AI tutor with a structured curriculum and interactive practice activities.
        </p>
      </motion.div>

      <motion.div
        initial={reducedMotion ? undefined : 'initial'}
        animate={reducedMotion ? undefined : 'animate'}
        variants={staggerContainer(0.1, 0.1)}
        className="mb-12 mt-12 space-y-6"
      >
        {STEPS.map((step, i) => (
          <motion.article
            key={step.title}
            variants={fadeInUp}
            className="flex gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 transition-transform duration-200 hover:translate-x-1.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--accent-soft)">
              <step.icon className="h-5 w-5 text-(--accent)" aria-hidden="true" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-(--text-muted)">Step {i + 1}</p>
              <h2 className="font-display font-bold text-(--text-primary)">{step.title}</h2>
              <p className="mt-1 text-sm text-(--text-secondary)">{step.desc}</p>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <motion.div
        initial={reducedMotion ? undefined : 'initial'}
        animate={reducedMotion ? undefined : 'animate'}
        variants={fadeInUp}
      >
        <Link href="/learn" className="inline-flex items-center gap-2 rounded-xl bg-(--accent) px-6 py-3 font-display font-bold text-white no-underline transition-all hover:bg-(--accent-hover) hover:-translate-y-0.5 active:translate-y-0">
          Start learning <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  )
}
