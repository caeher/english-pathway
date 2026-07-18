'use client'

import { useEffect, useMemo, useState } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { Check, Loader2, Mic, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ASSESSMENT_QUESTIONS,
  type AssessmentLevel,
  type AssessmentSource,
} from '@/lib/onboarding/assessment'

interface AssessmentResult {
  level: AssessmentLevel
  score: number
  rubricVersion: string
  explanation: string[]
}

interface LevelAssessmentProps {
  reviewing?: boolean
  onLevelConfirmed: (level: AssessmentLevel) => void
}

function VoiceControls({
  reviewing,
  onStarted,
}: {
  reviewing: boolean
  onStarted: () => void
}) {
  const { startSession, endSession, status, sendUserMessage } = useConversation()
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const connected = status === 'connected'

  useEffect(() => {
    void fetch(`/api/onboarding/assessment${reviewing ? '?review=1' : ''}`)
      .then((response) => response.json() as Promise<{ configured?: boolean }>)
      .then((data) => setConfigured(data.configured === true))
      .catch(() => setConfigured(false))
  }, [reviewing])

  useEffect(() => {
    if (!connected) return
    sendUserMessage('Guide me through the three short English level assessment prompts. Do not save audio or a transcript.')
  }, [connected, sendUserMessage])

  const start = async () => {
    setError(null)
    const response = await fetch(`/api/onboarding/assessment${reviewing ? '?review=1' : ''}`)
    if (!response.ok) {
      setError('Voice assessment is unavailable. You can use the text assessment instead.')
      return
    }
    const data = (await response.json()) as { configured?: boolean; signedUrl?: string }
    if (!data.configured || !data.signedUrl) {
      setError('Voice assessment is unavailable. You can use the text assessment instead.')
      return
    }
    onStarted()
    startSession({ signedUrl: data.signedUrl, textOnly: false })
  }

  if (configured !== true) return null

  return (
    <div className="rounded-2xl border border-(--border-primary) bg-(--bg-secondary)/50 p-4">
      <div className="flex items-start gap-3">
        <Mic className="mt-0.5 h-5 w-5 text-(--accent)" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-bold text-(--text-primary)">Optional voice conversation</p>
          <p className="mt-1 text-sm text-(--text-secondary)">ElevenLabs can guide the same short assessment. Audio and transcripts are not stored.</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!connected ? <Button type="button" variant="outline" onClick={start}><Play className="h-4 w-4" /> Start voice assessment</Button> : <Button type="button" variant="outline" onClick={() => endSession()}><Mic className="h-4 w-4" /> End voice assessment</Button>}
        {connected && <span className="self-center text-sm text-(--text-muted)">Voice session active. Complete the written prompts below to receive a scored result.</span>}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

function AssessmentContent({ reviewing, onLevelConfirmed }: LevelAssessmentProps) {
  const [source, setSource] = useState<AssessmentSource>('text')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [started, setStarted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const query = reviewing ? '?review=1' : ''

  const complete = useMemo(
    () => ASSESSMENT_QUESTIONS.every((question) => (answers[question.id] ?? '').trim().length >= 3),
    [answers],
  )

  const evaluate = async () => {
    setPending(true)
    setError(null)
    const response = await fetch(`/api/onboarding/assessment${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        answers: ASSESSMENT_QUESTIONS.map((question) => ({ questionId: question.id, response: answers[question.id] ?? '' })),
      }),
    })
    const data = (await response.json()) as AssessmentResult & { error?: string }
    setPending(false)
    if (!response.ok) {
      setError(data.error ?? 'Could not evaluate your responses.')
      return
    }
    setResult(data)
  }

  const confirm = async (level: AssessmentLevel) => {
    setPending(true)
    setError(null)
    const response = await fetch(`/api/onboarding/assessment${query}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, source, rubricVersion: result?.rubricVersion }),
    })
    const data = (await response.json()) as { error?: string }
    setPending(false)
    if (!response.ok) {
      setError(data.error ?? 'Could not save the confirmed level.')
      return
    }
    onLevelConfirmed(level)
  }

  if (!started) {
    return (
      <div className="space-y-3 rounded-2xl border border-(--border-primary) bg-(--bg-secondary)/40 p-4">
        <div>
          <p className="font-bold text-(--text-primary)">Optional level check</p>
          <p className="mt-1 text-sm text-(--text-secondary)">Answer three short prompts for a rubric-based suggestion. You can always keep or change your manual selection.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setStarted(true)}><Play className="h-4 w-4" /> Try the text assessment</Button>
        <VoiceControls reviewing={reviewing ?? false} onStarted={() => { setSource('voice'); setStarted(true) }} />
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-(--border-primary) bg-(--bg-secondary)/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-(--text-primary)">Level check</p>
          <p className="mt-1 text-sm text-(--text-secondary)">Your answers are scored briefly and then discarded. Only the result and rubric version are saved.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setStarted(false); setResult(null) }}><RotateCcw className="h-4 w-4" /> Reset</Button>
      </div>
      <VoiceControls reviewing={reviewing ?? false} onStarted={() => setSource('voice')} />
      {ASSESSMENT_QUESTIONS.map((question, index) => (
        <div key={question.id}>
          <label htmlFor={`assessment-${question.id}`} className="text-sm font-bold text-(--text-primary)">{index + 1}. {question.prompt}</label>
          <textarea id={`assessment-${question.id}`} value={answers[question.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} rows={3} maxLength={1000} className="mt-2 w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary)" />
        </div>
      ))}
      {!result ? <Button type="button" onClick={evaluate} disabled={!complete || pending}>{pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Scoring...</> : 'See my recommendation'}</Button> : (
        <div className="rounded-xl border border-(--accent)/30 bg-(--accent-soft) p-4" role="status" aria-live="polite">
          <p className="font-bold text-(--text-primary)">Suggested starting level: <span className="capitalize">{result.level}</span></p>
          <p className="mt-1 text-sm text-(--text-secondary)">Score {result.score} · Rubric {result.rubricVersion}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-(--text-secondary)">{result.explanation.map((item) => <li key={item}>{item}</li>)}</ul>
          <div className="mt-4 flex flex-wrap gap-2"><Button type="button" onClick={() => confirm(result.level)} disabled={pending}><Check className="h-4 w-4" /> Use this level</Button><Button type="button" variant="outline" onClick={() => setResult(null)} disabled={pending}>Keep my manual choice</Button></div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export default function LevelAssessment(props: LevelAssessmentProps) {
  return (
    <ConversationProvider textOnly={false}>
      <AssessmentContent {...props} />
    </ConversationProvider>
  )
}
