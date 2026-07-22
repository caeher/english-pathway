'use client'

import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/motion/system'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

const FAQ = [
  { q: 'Do I need to pay to use the platform?', a: 'No. You can start learning with the AI tutor for free. Creating an account is free and lets you manage your profile.' },
  { q: 'Can I use English Pathway on mobile?', a: 'Yes. The platform is responsive and you can install it as a PWA from your browser.' },
  { q: 'How does the AI tutor work?', a: 'The tutor guides you through lessons using voice or text, explains grammar on screen, and launches interactive activities when you are ready to practice.' },
  { q: 'Do I need an account to learn?', a: 'You can explore the learning experience without signing in. An account lets you save your profile and preferences.' },
]

export default function FaqView() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <motion.div
        initial={reducedMotion ? undefined : 'initial'}
        animate={reducedMotion ? undefined : 'animate'}
        variants={fadeInUp}
      >
        <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">FAQ</p>
        <h1 className="mt-3 font-display text-4xl font-black text-(--text-primary)">Frequently asked questions</h1>
      </motion.div>

      <motion.div
        initial={reducedMotion ? undefined : 'initial'}
        animate={reducedMotion ? undefined : 'animate'}
        variants={staggerContainer(0.08, 0.1)}
        className="mt-8 space-y-4"
      >
        {FAQ.map((item) => (
          <motion.details
            key={item.q}
            variants={fadeInUp}
            className="group rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 transition-colors duration-200 hover:border-(--accent-soft)"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between font-display font-bold text-(--text-primary)">
              {item.q}
              <span className="text-(--accent) transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-(--text-secondary)">{item.a}</p>
          </motion.details>
        ))}
      </motion.div>
    </div>
  )
}
