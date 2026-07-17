'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Headphones,
  Mic,
  MicOff,
  Sparkles,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics/events'
import {
  completeOnboardingAction,
  type OnboardingActionState,
} from '@/lib/onboarding/actions'
import type { DailyGoalMinutes, OnboardingLevel } from '@/lib/onboarding/schemas'

const LEVELS: Array<{ value: OnboardingLevel; title: string; description: string }> = [
  { value: 'beginner', title: 'Beginner', description: 'I am starting from the basics.' },
  { value: 'intermediate', title: 'Intermediate', description: 'I can handle everyday conversations.' },
  { value: 'advanced', title: 'Advanced', description: 'I want to sharpen fluency and accuracy.' },
]

const GOALS: Array<{ value: DailyGoalMinutes; title: string; description: string }> = [
  { value: 5, title: '5 minutes', description: 'A small habit that is easy to keep.' },
  { value: 10, title: '10 minutes', description: 'A balanced daily practice rhythm.' },
  { value: 20, title: '20 minutes', description: 'A focused session for faster progress.' },
]

type MicState = 'idle' | 'checking' | 'granted' | 'denied' | 'unavailable'

interface OnboardingWizardProps {
  initialLevel: OnboardingLevel | null
  initialDailyGoalMinutes: number | null
  destination: string
  reviewing?: boolean
}

function ChoiceCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors ${
        selected
          ? 'border-(--accent) bg-(--accent-soft)'
          : 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-(--accent) bg-(--accent) text-white' : 'border-(--border-primary)'
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
      <span>
        <span className="block font-display font-bold text-(--text-primary)">{title}</span>
        <span className="mt-1 block text-sm text-(--text-secondary)">{description}</span>
      </span>
    </button>
  )
}

export default function OnboardingWizard({
  initialLevel,
  initialDailyGoalMinutes,
  destination,
  reviewing = false,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [level, setLevel] = useState<OnboardingLevel | null>(initialLevel)
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<DailyGoalMinutes | null>(
    initialDailyGoalMinutes === 5 || initialDailyGoalMinutes === 10 || initialDailyGoalMinutes === 20
      ? initialDailyGoalMinutes
      : null
  )
  const [micState, setMicState] = useState<MicState>('idle')
  const [state, setState] = useState<OnboardingActionState>({})
  const [pending, setPending] = useState(false)

  const stepName = useMemo(() => ['welcome', 'level', 'daily_goal', 'microphone'][step], [step])

  useEffect(() => {
    trackEvent('onboarding_step', {
      step: stepName,
      selection: step === 1 ? level : step === 2 ? dailyGoalMinutes : step === 3 ? micState : null,
    })
  }, [dailyGoalMinutes, level, micState, step, stepName])

  const requestMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState('unavailable')
      trackEvent('onboarding_step', { step: 'microphone', microphone_permission: 'unavailable' })
      return
    }

    setMicState('checking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setMicState('granted')
      trackEvent('onboarding_step', { step: 'microphone', microphone_permission: 'granted' })
    } catch (error) {
      const errorName =
        error instanceof DOMException
          ? error.name
          : error && typeof error === 'object' && 'name' in error
            ? String(error.name)
            : ''
      const denied = ['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(errorName)
      const nextState = denied ? 'denied' : 'unavailable'
      setMicState(nextState)
      trackEvent('onboarding_step', { step: 'microphone', microphone_permission: nextState })
    }
  }

  const submit = async (skipped: boolean) => {
    setPending(true)
    setState({})
    const result = await completeOnboardingAction({
      level: level ?? undefined,
      dailyGoalMinutes: dailyGoalMinutes ?? undefined,
      skipped,
    })
    setPending(false)

    if (result.error) {
      setState(result)
      return
    }

    trackEvent('onboarding_complete', {
      level,
      daily_goal_minutes: dailyGoalMinutes,
      skipped,
      microphone_permission: micState,
    })
    router.replace(destination)
  }

  const canAdvance = step === 0 || (step === 1 ? !!level : step === 2 ? !!dailyGoalMinutes : true)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-(--accent)">English Pathway</p>
          <p className="mt-1 text-sm text-(--text-muted)">Step {step + 1} of 4</p>
        </div>
        <div className="flex gap-1.5" aria-label={`Step ${step + 1} of 4`}>
          {[0, 1, 2, 3].map((item) => (
            <span
              key={item}
              className={`h-2 w-8 rounded-full ${item <= step ? 'bg-(--accent)' : 'bg-(--border-primary)'}`}
            />
          ))}
        </div>
      </div>

      <section className="rounded-3xl border border-(--border-primary) bg-(--bg-card) p-6 shadow-sm sm:p-10">
        {step === 0 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black text-(--text-primary)">
                {reviewing ? 'Review your learning setup' : 'Welcome to English Pathway'}
              </h1>
              <p className="mx-auto mt-3 max-w-lg leading-relaxed text-(--text-secondary)">
                Your AI tutor will guide conversations, explain grammar, and bring interactive
                practice into the same lesson. This takes less than a minute to personalize.
              </p>
            </div>
            <div className="grid gap-3 text-left sm:grid-cols-3">
              {[
                [Headphones, 'Practice with guidance'],
                [Target, 'Choose a realistic goal'],
                [Clock3, 'Build a daily habit'],
              ].map(([Icon, label]) => (
                <div key={label as string} className="rounded-2xl bg-(--bg-secondary)/50 p-4">
                  <Icon className="h-5 w-5 text-(--accent)" />
                  <p className="mt-2 text-sm font-bold text-(--text-primary)">{label as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-black text-(--text-primary)">What is your English level?</h1>
              <p className="mt-2 text-(--text-secondary)">There are no wrong answers. We will use this to tailor your starting point.</p>
            </div>
            <div className="space-y-3">
              {LEVELS.map((item) => (
                <ChoiceCard
                  key={item.value}
                  {...item}
                  selected={level === item.value}
                  onClick={() => setLevel(item.value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-black text-(--text-primary)">How much time can you practice?</h1>
              <p className="mt-2 text-(--text-secondary)">A consistent small goal beats an ambitious plan you cannot keep.</p>
            </div>
            <div className="space-y-3">
              {GOALS.map((item) => (
                <ChoiceCard
                  key={item.value}
                  {...item}
                  selected={dailyGoalMinutes === item.value}
                  onClick={() => setDailyGoalMinutes(item.value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-black text-(--text-primary)">Would you like to use voice practice?</h1>
              <p className="mt-2 text-(--text-secondary)">
                Microphone access lets the tutor listen to your speaking. We request it only when
                you choose, and the stream is released immediately after checking.
              </p>
            </div>
            <div className="rounded-2xl border border-(--border-primary) bg-(--bg-secondary)/50 p-5">
              <div className="flex items-start gap-3">
                {micState === 'granted' ? (
                  <Mic className="mt-0.5 h-5 w-5 text-(--success)" />
                ) : micState === 'denied' ? (
                  <MicOff className="mt-0.5 h-5 w-5 text-(--text-muted)" />
                ) : (
                  <Mic className="mt-0.5 h-5 w-5 text-(--accent)" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-(--text-primary)">
                    {micState === 'granted' && 'Microphone enabled'}
                    {micState === 'denied' && 'Microphone denied'}
                    {micState === 'unavailable' && 'Microphone unavailable'}
                    {(micState === 'idle' || micState === 'checking') && 'Microphone permission'}
                  </p>
                  <p className="mt-1 text-sm text-(--text-secondary)">
                    {micState === 'granted' && 'Voice practice is ready when your tutor starts.'}
                    {micState === 'denied' && 'You can continue in text mode. You can change this in your browser settings later.'}
                    {micState === 'unavailable' && 'This browser does not provide microphone access. You can continue in text mode.'}
                    {(micState === 'idle' || micState === 'checking') && 'You can enable this now or continue without voice.'}
                  </p>
                </div>
              </div>
              {micState !== 'granted' && micState !== 'checking' && (
                <Button type="button" variant="outline" className="mt-4" onClick={requestMicrophone}>
                  <Mic className="h-4 w-4" /> Allow microphone
                </Button>
              )}
              {micState === 'checking' && <p className="mt-4 text-sm text-(--text-muted)">Waiting for your browser...</p>}
            </div>
          </div>
        )}

        {state.error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {state.error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || pending}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => submit(true)} disabled={pending}>
              Skip for now
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((current) => Math.min(3, current + 1))}
                disabled={!canAdvance || pending}
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={() => submit(false)} disabled={pending}>
                {pending ? 'Saving...' : 'Complete'} <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
