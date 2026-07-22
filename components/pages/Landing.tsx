'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Headphones,
  MessageCircle,
  Mic,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Volume2,
  CheckCircle2,
  Award,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics/events'
import { Badge, Surface } from '@/components/ui'
import {
  fadeInUp,
  staggerContainer,
  heroMockupVariants,
  chatBubbleVariants,
  motionEase,
} from '@/lib/motion/system'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

const METHOD = [
  {
    icon: MessageCircle,
    step: '01',
    title: 'Start with a real conversation',
    description: 'Talk or type with an AI tutor that keeps the lesson focused on what you want to say.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'See the right explanation',
    description: 'Grammar and vocabulary appear in context, when they help you communicate more clearly.',
  },
  {
    icon: Target,
    step: '03',
    title: 'Practice until it sticks',
    description: 'Turn each lesson into a short activity, then return to the path whenever you are ready to practice.',
  },
]

const JOURNEY = [
  ['Choose your starting point', 'A short setup makes your first session feel relevant.'],
  ['Learn with your tutor', 'Voice and text keep practice close to everyday English.'],
  ['Practice in the moment', 'Quizzes, flashcards, and speaking activities reinforce the lesson.'],
  ['Build a steady habit', 'Keep moving through a clear curriculum at your own pace.'],
]

const CURRICULUM_TOPICS = ['Everyday conversations', 'Grammar in context', 'Useful vocabulary', 'Pronunciation practice']

interface LandingProps {
  isAuthenticated?: boolean
}

export default function Landing({ isAuthenticated = false }: LandingProps) {
  const reducedMotion = useReducedMotion()
  const destination = isAuthenticated ? '/learn' : '/register?redirectTo=%2Fonboarding'
  const primaryLabel = isAuthenticated ? 'Continue learning' : 'Create your free account'

  function onCtaClick(cta: string, ctaDestination: string) {
    trackEvent('landing_cta_click', {
      cta,
      location: 'landing',
      auth_state: isAuthenticated ? 'authenticated' : 'visitor',
      destination: ctaDestination,
    })
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-(--accent) via-amber-600 to-orange-600 text-white -mt-16" aria-labelledby="landing-title">
        {/* Animated background decorative glow circles */}
        <motion.div
          className="absolute -right-24 -top-24 h-[550px] w-[550px] rounded-full bg-white/[0.08] blur-3xl pointer-events-none"
          aria-hidden="true"
          animate={reducedMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-36 -left-36 h-[600px] w-[600px] rounded-full bg-black/[0.12] blur-3xl pointer-events-none"
          aria-hidden="true"
          animate={reducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.12, 0.18, 0.12] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[800px] rounded-full bg-amber-400/[0.05] blur-2xl pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Content Column */}
            <motion.div
              initial={reducedMotion ? undefined : 'initial'}
              animate={reducedMotion ? undefined : 'animate'}
              variants={staggerContainer(0.08)}
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300"></span>
                </span>
                <span className="text-xs font-bold tracking-wide uppercase text-white/90">Interactive AI Voice & Text Tutor</span>
              </motion.div>

              <motion.h1 variants={fadeInUp} id="landing-title" className="mt-6 font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-6xl">
                Learn English by using it in real conversation.
              </motion.h1>
              <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/90 sm:text-xl">
                English Pathway brings a natural AI voice tutor, a structured 77-chapter curriculum, and interactive activities into one calm learning space.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={destination}
                  onClick={() => onCtaClick('primary', destination)}
                  className="group inline-flex min-h-13 items-center gap-3 rounded-2xl bg-white px-7 py-4 font-display text-base font-bold text-(--text-primary) no-underline shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 hover:shadow-black/30 active:translate-y-0"
                >
                  {primaryLabel}
                  <ArrowRight className="h-5 w-5 text-(--accent) transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/curriculum"
                  onClick={() => onCtaClick('curriculum', '/curriculum')}
                  className="inline-flex min-h-13 items-center gap-3 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 font-display text-base font-bold text-white no-underline backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Explore curriculum <BookOpen className="h-5 w-5" aria-hidden="true" />
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap items-center gap-6 text-sm font-semibold text-white/80">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-300" aria-hidden="true" /> Free interactive lessons
                </span>
                <span className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-amber-300" aria-hidden="true" /> Real-time voice practice
                </span>
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-300" aria-hidden="true" /> 14 Structured modules
                </span>
              </motion.div>
            </motion.div>

            {/* Right Column - Live Interactive Mockup Card */}
            <motion.div
              initial={reducedMotion ? undefined : 'initial'}
              animate={reducedMotion ? undefined : 'animate'}
              variants={heroMockupVariants}
              className="relative"
            >
              <div className="relative mx-auto w-full max-w-md rounded-3xl border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-7 transition-shadow duration-300 hover:shadow-amber-500/10">
                {/* Header of Mockup */}
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-(--accent) font-black shadow-md">
                      AI
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Pathway AI Tutor</p>
                      <p className="text-xs text-white/70">Voice Active · Chapter 4</p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="border-white/20 bg-white/15 text-xs text-white">
                    <Mic className="mr-1.5 h-3 w-3 animate-pulse text-amber-300" /> Speaking
                  </Badge>
                </div>

                {/* Simulated Tutor Conversation Chat */}
                <motion.div
                  initial={reducedMotion ? undefined : 'initial'}
                  animate={reducedMotion ? undefined : 'animate'}
                  variants={staggerContainer(0.12, 0.2)}
                  className="my-5 space-y-3.5"
                >
                  {/* Tutor Message */}
                  <motion.div variants={chatBubbleVariants} className="rounded-2xl border border-white/10 bg-white/15 p-3.5 text-xs sm:text-sm text-white/95 leading-relaxed shadow-sm">
                    <p className="font-semibold text-amber-200 text-xs mb-1">AI TUTOR</p>
                    &quot;Great job! How would you describe your typical morning routine in English?&quot;
                  </motion.div>

                  {/* Learner Speech Bubble */}
                  <motion.div variants={chatBubbleVariants} className="ml-6 rounded-2xl bg-white/90 p-3.5 text-xs sm:text-sm text-neutral-900 leading-relaxed shadow-lg">
                    <p className="font-semibold text-(--accent) text-xs mb-1">YOU</p>
                    &quot;I <span className="underline decoration-amber-500 decoration-2 font-bold">usually</span> start my day with a hot cup of coffee and read news.&quot;
                  </motion.div>

                  {/* Live Grammar Feedback Pill */}
                  <motion.div variants={chatBubbleVariants} className="rounded-xl border border-amber-300/40 bg-amber-400/20 p-3 text-xs text-amber-100 backdrop-blur-sm flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-300 mt-0.5 animate-spin-slow" />
                    <div>
                      <span className="font-bold text-white">Grammar Note:</span> &quot;Usually&quot; is an adverb of frequency placed before main verbs.
                    </div>
                  </motion.div>
                </motion.div>

                {/* Footer of Mockup */}
                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.3 }}
                  className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 text-xs text-white/85 border border-white/10"
                >
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" /> Activity unlocked: Flashcards
                  </span>
                  <span className="font-bold text-amber-300">+25 XP</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Method Section */}
      <section id="method" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 sm:py-24" aria-labelledby="method-title">
        <motion.div
          initial={reducedMotion ? undefined : 'initial'}
          whileInView={reducedMotion ? undefined : 'animate'}
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
          className="max-w-2xl"
        >
          <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">The method</p>
          <h2 id="method-title" className="mt-3 font-display text-3xl font-black tracking-tight text-(--text-primary) sm:text-4xl">
            One learning loop, from conversation to confidence.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-(--text-secondary)">
            The next useful step is always close by, so you can spend less time choosing what to study and more time using English.
          </p>
        </motion.div>

        <motion.div
          initial={reducedMotion ? undefined : 'initial'}
          whileInView={reducedMotion ? undefined : 'animate'}
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer(0.1)}
          className="mt-10 grid gap-5 md:grid-cols-3"
        >
          {METHOD.map(({ icon: Icon, step, title, description }) => (
            <motion.div key={step} variants={fadeInUp}>
              <Surface as="article" padding="lg" elevation="raised" className="h-full rounded-3xl transition-transform duration-200 hover:-translate-y-1.5 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="font-display text-sm font-black text-(--text-muted)">{step}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-black text-(--text-primary)">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{description}</p>
              </Surface>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Journey Section */}
      <section id="journey" className="bg-(--bg-secondary)" aria-labelledby="journey-title">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <motion.div
            initial={reducedMotion ? undefined : 'initial'}
            whileInView={reducedMotion ? undefined : 'animate'}
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">Your pathway</p>
            <h2 id="journey-title" className="mt-3 font-display text-3xl font-black tracking-tight text-(--text-primary) sm:text-4xl">
              A guided route that still feels like yours.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-(--text-secondary)">
              Begin where you are, follow a useful prompt, and make progress in sessions that fit your day.
            </p>
            <Link
              href="/how-it-works"
              onClick={() => onCtaClick('how_it_works', '/how-it-works')}
              className="mt-7 inline-flex items-center gap-2 font-bold text-(--accent) no-underline hover:underline"
            >
              See how it works <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>

          <motion.ol
            initial={reducedMotion ? undefined : 'initial'}
            whileInView={reducedMotion ? undefined : 'animate'}
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer(0.08)}
            className="space-y-3"
          >
            {JOURNEY.map(([title, description], index) => (
              <motion.li
                key={title}
                variants={fadeInUp}
                className="flex gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 transition-transform duration-200 hover:translate-x-1.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--accent) font-display text-sm font-black text-white" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display font-black text-(--text-primary)">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-(--text-secondary)">{description}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* Curriculum Preview Section */}
      <section id="curriculum-preview" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 sm:py-24" aria-labelledby="curriculum-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <motion.div
            initial={reducedMotion ? undefined : 'initial'}
            whileInView={reducedMotion ? undefined : 'animate'}
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--secondary-soft) text-(--secondary)">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 id="curriculum-title" className="mt-6 font-display text-3xl font-black tracking-tight text-(--text-primary) sm:text-4xl">
              A curriculum you can actually follow.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-(--text-secondary)">
              Explore lessons by topic, bring a chapter to your tutor, and practice the language you need next.
            </p>
            <Link
              href="/curriculum"
              onClick={() => onCtaClick('curriculum_preview', '/curriculum')}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-(--accent) px-5 py-3 font-display font-bold text-white no-underline transition-all hover:bg-(--accent-hover) hover:-translate-y-0.5 active:translate-y-0"
            >
              Browse all topics <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : 'initial'}
            whileInView={reducedMotion ? undefined : 'animate'}
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer(0.08)}
            className="grid gap-3 sm:grid-cols-2"
          >
            {CURRICULUM_TOPICS.map((topic) => (
              <motion.div
                key={topic}
                variants={fadeInUp}
                className="flex items-center gap-3 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-4 transition-transform duration-200 hover:scale-[1.02]"
              >
                <Check className="h-5 w-5 shrink-0 text-(--secondary)" aria-hidden="true" />
                <span className="text-sm font-bold text-(--text-primary)">{topic}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Practice Features Section */}
      <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24" aria-labelledby="practice-title">
        <motion.div
          initial={reducedMotion ? undefined : 'initial'}
          whileInView={reducedMotion ? undefined : 'animate'}
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer(0.1)}
          className="grid gap-5 sm:grid-cols-3"
        >
          {[
            [Headphones, 'Guidance when you need it', 'Ask for an explanation or keep the conversation moving.'],
            [Mic, 'Voice or text practice', 'Use the mode that suits your space, device, and confidence today.'],
            [TrendingUp, 'Progress you can feel', 'Small, repeatable sessions make it easier to keep going.'],
          ].map(([Icon, title, description], index) => (
            <motion.div key={title as string} variants={fadeInUp} className="rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
              <Icon className="h-5 w-5 text-(--accent)" aria-hidden="true" />
              <h2 id={index === 0 ? 'practice-title' : undefined} className="mt-4 font-display font-black text-(--text-primary)">{title as string}</h2>
              <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{description as string}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24" aria-labelledby="final-cta-title">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 20, scale: 0.98 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.45, ease: motionEase }}
          className="rounded-3xl bg-(--accent) text-white px-6 py-12 sm:px-12 sm:py-16 shadow-xl relative overflow-hidden"
        >
          <div className="max-w-2xl relative z-10">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/75"><Play className="h-4 w-4" aria-hidden="true" /> Your next step</p>
            <h2 id="final-cta-title" className="mt-4 font-display text-3xl font-black sm:text-4xl">Make today&apos;s English practice count.</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">Open a lesson, find your starting point, and let the pathway take care of what comes next.</p>
            <Link
              href={destination}
              onClick={() => onCtaClick('final', destination)}
              className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-2xl bg-white px-6 py-3.5 font-display font-bold text-(--text-primary) no-underline transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
            >
              {primaryLabel} <ArrowRight className="h-5 w-5 text-(--accent)" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-(--border-primary)" aria-label="Footer">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-(--text-primary) no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent) text-[10px] font-black text-white">ie</span>
            English Pathway
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-(--text-muted)" aria-label="Footer navigation">
            <Link href="/how-it-works" className="hover:text-(--accent)">How it works</Link>
            <Link href="/curriculum" className="hover:text-(--accent)">Curriculum</Link>
            <Link href="/faq" className="hover:text-(--accent)">FAQ</Link>
            <Link href="/legal/terms" className="hover:text-(--accent)">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-(--accent)">Privacy</Link>
            <Link href="/legal/cookies" className="hover:text-(--accent)">Cookies</Link>
          </nav>
          <p className="text-sm text-(--text-muted)">© {new Date().getFullYear()} English Pathway</p>
        </div>
      </footer>
    </>
  )
}
