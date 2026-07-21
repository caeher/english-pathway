export type SessionMode = 'voice' | 'text'

export type MicrophoneState = 'idle' | 'checking' | 'ready' | 'denied' | 'unavailable' | 'error'

export interface SessionOrchestration {
  sessionId?: string
  instruction?: string
  learner?: {
    level: string | null
    dailyGoalMinutes: number | null
    preferredMode: string | null
  } | null
  progress?: {
    lastChapterId: string | null
    lastActivityId: string | null
  } | null
}

export interface SessionConfig {
  agentId?: string
  signedUrl?: string
  textOnly: boolean
  orchestration?: SessionOrchestration
}
