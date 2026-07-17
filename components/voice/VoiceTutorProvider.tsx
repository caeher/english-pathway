'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react'
import TutorClientTools from './TutorClientTools'
import LearnSessionLayout from '@/components/learn/LearnSessionLayout'
import { Button } from '@/components/ui/button'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import { trackEvent } from '@/lib/analytics/events'
import { enqueueSrsItems } from '@/lib/srs/client'
import { fetchActivityById } from '@/lib/learn/client-tools'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { saveActivityProgress } from '@/lib/progress/client'
import ContinueLearningPrompt from '@/components/progress/ContinueLearningPrompt'
import ProgressSync from '@/components/progress/ProgressSync'

interface SessionConfig {
  agentId?: string
  signedUrl?: string
  textOnly: boolean
}

function TutorControls({ textOnly }: { textOnly: boolean }) {
  const { startSession, endSession, status, isMuted, setMuted, sendUserMessage } = useConversation()
  const [message, setMessage] = useState('')
  const active = status === 'connected'

  const handleStart = useCallback(async () => {
    const res = await fetch('/api/tutor/session')
    if (!res.ok) return
    const config = (await res.json()) as SessionConfig
    const sessionTextOnly = textOnly || config.textOnly
    if (config.signedUrl) {
      startSession({ signedUrl: config.signedUrl, textOnly: sessionTextOnly })
    } else if (config.agentId) {
      startSession({ agentId: config.agentId, textOnly: sessionTextOnly })
    }
  }, [startSession, textOnly])

  const handleActivityComplete = useCallback((result: ActivityCompleteResult) => {
    const pct = result.scorePercent ?? Math.round((result.score / result.total) * 100)
    sendUserMessage(
      `I finished activity ${result.activityId} (${result.activityType}) with ${pct}% score.`
    )
    trackEvent('activity_complete', {
      activity_id: result.activityId,
      activity_type: result.activityType,
      score_percent: pct,
    })
    if (result.chapterId && result.moduleId) {
      void saveActivityProgress({
        activityId: result.activityId,
        activityType: result.activityType,
        chapterId: result.chapterId,
        moduleId: result.moduleId,
        status: 'completed',
        score: pct,
        attempts: 1,
      })
    }
    void enqueueSrsItems(result.reviewContentRefs ?? [])
  }, [sendUserMessage])

  const handleActivityDifficult = useCallback(async (activityId: string) => {
    try {
      const { activity } = await fetchActivityById(activityId)
      await enqueueSrsItems(getReviewContentRefs(activity))
    } catch {
      // SRS is an enhancement; learning remains usable when it is unavailable.
    }
  }, [])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    sendUserMessage(message.trim())
    setMessage('')
  }

  return (
    <LearnSessionLayout
      tutorSlot={
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-(--border-primary)">
            <h1 className="font-display font-black text-lg text-(--text-primary)">AI English Tutor</h1>
            <p className="text-xs text-(--text-muted) mt-1">
              {textOnly
                ? 'Text conversation mode'
                : 'Voice-guided lessons with interactive activities'}
            </p>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {!active ? (
                <Button onClick={handleStart} className="gap-2">
                  {status === 'connecting' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                  Start lesson
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => endSession()} className="gap-2">
                    <PhoneOff className="w-4 h-4" /> End
                  </Button>
                  {!textOnly && (
                    <Button variant="outline" onClick={() => setMuted(!isMuted)} className="gap-2">
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                  )}
                </>
              )}
            </div>

            <p className="text-xs text-(--text-muted) capitalize">Status: {status}</p>

            {textOnly && active && (
              <form onSubmit={handleSend} className="mt-auto flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-xl border border-(--border-primary) bg-(--bg-card) text-sm text-(--text-primary)"
                />
                <Button type="submit" size="sm">
                  Send
                </Button>
              </form>
            )}
          </div>
        </div>
      }
      onActivityComplete={handleActivityComplete}
      onActivityDifficult={handleActivityDifficult}
    />
  )
}

interface VoiceTutorProviderProps {
  children?: React.ReactNode
}

export default function VoiceTutorProvider({ children }: VoiceTutorProviderProps) {
  const [textOnly, setTextOnly] = useState(true)

  useEffect(() => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
    if (!agentId || !navigator.mediaDevices?.getUserMedia) {
      setTextOnly(true)
      return
    }

    let cancelled = false
    let permissionStatus: PermissionStatus | undefined
    const handlePermissionChange = () => {
      if (permissionStatus) updatePermission(permissionStatus.state)
    }

    const updatePermission = (state: PermissionState) => {
      if (!cancelled) setTextOnly(state !== 'granted')
    }

    if (!navigator.permissions?.query) {
      setTextOnly(true)
      return () => {
        cancelled = true
      }
    }

    void navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((status) => {
        if (cancelled) return
        permissionStatus = status
        updatePermission(status.state)
        status.addEventListener('change', handlePermissionChange)
      })
      .catch(() => setTextOnly(true))

    return () => {
      cancelled = true
      permissionStatus?.removeEventListener('change', handlePermissionChange)
    }
  }, [])

  return (
    <ConversationProvider textOnly={textOnly}>
      <ProgressSync />
      <ContinueLearningPrompt />
      <TutorClientTools />
      {children ?? <TutorControls textOnly={textOnly} />}
    </ConversationProvider>
  )
}
