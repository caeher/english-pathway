'use client'

import Link from 'next/link'
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
  Zap,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics/events'
import { Badge, Surface } from '@/components/ui'

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
      <section className="relative overflow-hidden bg-(--accent) text-white" aria-labelledby="landing-title">
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/[0.06]" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-black/[0.04]" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <Badge variant="neutral" className="mb-6 border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90">
              <Zap className="h-4 w-4" aria-hidden="true" /> A clearer path to confident English
            </Badge>
            <h1 id="landing-title" className="font-display text-5xl font-black leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">
              Learn English by using it.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-relaxed text-white/85 sm:text-xl">
              English Pathway brings an AI tutor, a structured curriculum, and focused practice into one calm learning space.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={destination}
                onClick={() => onCtaClick('primary', destination)}
                className="group inline-flex min-h-12 items-center gap-3 rounded-2xl bg-white px-6 py-3.5 font-display text-base font-bold text-(--text-primary) no-underline shadow-xl shadow-black/10 transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
              >
                {primaryLabel}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/curriculum"
                onClick={() => onCtaClick('curriculum', '/curriculum')}
                className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-6 py-3.5 font-display text-base font-bold text-white no-underline transition-colors hover:bg-white/20"
              >
                Explore the curriculum <BookOpen className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-white/75">
              <Check className="h-4 w-4" aria-hidden="true" /> Start with text, add voice when you are ready.
            </p>
          </div>
        </div>
      </section>

      <section id="method" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 sm:py-24" aria-labelledby="method-title">
        <div className="max-w-2xl">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-(--accent)">The method</p>
          <h2 id="method-title" className="mt-3 font-display text-3xl font-black tracking-tight text-(--text-primary) sm:text-4xl">
            One learning loop, from conversation to confidence.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-(--text-secondary)">
            The next useful step is always close by, so you can spend less time choosing what to study and more time using English.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {METHOD.map(({ icon: Icon, step, title, description }) => (
            <Surface as="article" key={step} padding="lg" elevation="raised" className="rounded-3xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-display text-sm font-black text-(--text-muted)">{step}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-black text-(--text-primary)">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{description}</p>
            </Surface>
          ))}
        </div>
      </section>

      <section id="journey" className="bg-(--bg-secondary)" aria-labelledby="journey-title">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
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
          </div>

          <ol className="space-y-3">
            {JOURNEY.map(([title, description], index) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--accent) font-display text-sm font-black text-white" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display font-black text-(--text-primary)">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-(--text-secondary)">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="curriculum-preview" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 sm:py-24" aria-labelledby="curriculum-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
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
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-(--accent) px-5 py-3 font-display font-bold text-white no-underline transition-colors hover:bg-(--accent-hover)"
            >
              Browse all topics <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CURRICULUM_TOPICS.map((topic) => (
              <div key={topic} className="flex items-center gap-3 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-4">
                <Check className="h-5 w-5 shrink-0 text-(--secondary)" aria-hidden="true" />
                <span className="text-sm font-bold text-(--text-primary)">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24" aria-labelledby="practice-title">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            [Headphones, 'Guidance when you need it', 'Ask for an explanation or keep the conversation moving.'],
            [Mic, 'Voice or text practice', 'Use the mode that suits your space, device, and confidence today.'],
            [TrendingUp, 'Progress you can feel', 'Small, repeatable sessions make it easier to keep going.'],
          ].map(([Icon, title, description], index) => (
            <div key={title as string} className="rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5">
              <Icon className="h-5 w-5 text-(--accent)" aria-hidden="true" />
              <h2 id={index === 0 ? 'practice-title' : undefined} className="mt-4 font-display font-black text-(--text-primary)">{title as string}</h2>
              <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{description as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-6 mb-20 rounded-3xl bg-(--accent) text-white sm:mb-24" aria-labelledby="final-cta-title">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/75"><Play className="h-4 w-4" aria-hidden="true" /> Your next step</p>
            <h2 id="final-cta-title" className="mt-4 font-display text-3xl font-black sm:text-4xl">Make today&apos;s English practice count.</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">Open a lesson, find your starting point, and let the pathway take care of what comes next.</p>
            <Link
              href={destination}
              onClick={() => onCtaClick('final', destination)}
              className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-2xl bg-white px-6 py-3.5 font-display font-bold text-(--text-primary) no-underline transition-transform hover:-translate-y-0.5"
            >
              {primaryLabel} <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

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
