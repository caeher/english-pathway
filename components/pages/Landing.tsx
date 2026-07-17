'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, GraduationCap, Star, Zap, MessageCircle, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/events'

const TESTIMONIALS = [
  { name: 'Maria G.', text: 'The AI tutor explains grammar clearly and the activities feel like real practice.', rating: 5 },
  { name: 'Carlos R.', text: 'I love how lessons adapt — quizzes and flashcards appear right when I need them.', rating: 5 },
  { name: 'Ana L.', text: 'Voice guidance plus interactive exercises made learning English much easier.', rating: 5 },
]

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function Landing() {
  const features = [
    { icon: MessageCircle, label: 'AI voice tutor', color: '#e85d3a' },
    { icon: Sparkles, label: 'Interactive activities', color: '#1a9e8f' },
    { icon: GraduationCap, label: 'Structured curriculum', color: '#e5a411' },
    { icon: Zap, label: 'Start instantly', color: '#c74882' },
  ]

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-(--accent)" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/[0.06]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-black/[0.04]" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 lg:py-36"
        >
          <div className="max-w-2xl">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-semibold text-white/90 mb-8 border border-white/10"
            >
              <Zap className="w-4 h-4" /> Learn English with an AI tutor
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6"
            >
              Master English
              <br />
              <span className="relative inline-block mt-1">with guided practice</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-white/80 max-w-lg mb-10 leading-relaxed font-medium"
            >
              Your personal tutor explains lessons, launches quizzes and games, and adapts to your progress.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5 mb-10">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/12 backdrop-blur-sm text-white text-[13px] font-semibold border border-white/10"
                >
                  <f.icon className="w-4 h-4" />
                  {f.label}
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link
                href="/learn"
                onClick={() => trackEvent('landing_cta_click', { cta: 'learn' })}
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-white text-(--text-primary) font-display font-bold text-base no-underline shadow-xl shadow-black/10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Start learning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/curriculum"
                onClick={() => trackEvent('landing_cta_click', { cta: 'curriculum' })}
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-display font-bold text-base no-underline border border-white/20 hover:bg-white/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Browse curriculum
                <BookOpen className="w-5 h-5" />
              </Link>
              <Link
                href="/register"
                onClick={() => trackEvent('landing_cta_click', { cta: 'register' })}
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-display font-bold text-base no-underline border border-white/20 hover:bg-white/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Create account
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          {[
            { icon: GraduationCap, value: '14', label: 'Learning modules' },
            { icon: Sparkles, value: '77', label: 'Chapters' },
            { icon: MessageCircle, value: 'AI', label: 'Voice guidance' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl border border-(--border-primary) bg-(--bg-card)"
            >
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-(--accent)" />
              <p className="font-display font-black text-3xl text-(--text-primary)">{stat.value}</p>
              <p className="text-sm text-(--text-muted)">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl border border-(--border-primary) bg-(--bg-card)"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-(--reward) text-(--reward)" />
                ))}
              </div>
              <p className="text-sm text-(--text-secondary) mb-3 leading-relaxed">&ldquo;{item.text}&rdquo;</p>
              <p className="text-xs font-bold text-(--text-primary)">{item.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-3xl border-2 border-(--border-primary) bg-(--bg-card) p-8 sm:p-12">
          <h2 className="font-display text-3xl font-black text-(--text-primary) mb-4">How it works</h2>
          <p className="text-(--text-secondary) max-w-2xl mb-8">
            Talk with your tutor, review grammar on screen, and complete interactive activities as you go.
          </p>
          <ol className="grid sm:grid-cols-3 gap-6">
            {[
              'Start a lesson with the AI tutor.',
              'Get explanations and launch practice activities.',
              'Create an account to save your profile.',
            ].map((step, i) => (
              <li key={step} className="rounded-2xl bg-(--bg-tertiary)/50 p-5">
                <span className="font-display text-xs font-bold uppercase tracking-widest text-(--accent)">
                  Step {i + 1}
                </span>
                <p className="mt-2 text-sm text-(--text-primary) font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-(--border-primary)">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
              <span className="text-white font-display font-black text-[10px]">ie</span>
            </div>
            <span className="font-display font-bold text-sm text-(--text-muted)">English Pathway</span>
          </div>
          <nav className="flex flex-wrap gap-4 text-xs text-(--text-muted)">
            <Link href="/how-it-works" className="hover:text-(--accent) no-underline">How it works</Link>
            <Link href="/learn" className="hover:text-(--accent) no-underline">Learn</Link>
            <Link href="/curriculum" className="hover:text-(--accent) no-underline">Curriculum</Link>
            <Link href="/faq" className="hover:text-(--accent) no-underline">FAQ</Link>
            <Link href="/legal/privacy" className="hover:text-(--accent) no-underline">Privacy</Link>
          </nav>
          <p className="text-xs text-(--text-muted)">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  )
}
