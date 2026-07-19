export type SessionMode = 'voice' | 'text'

export type MicrophoneState = 'idle' | 'checking' | 'ready' | 'denied' | 'unavailable' | 'error'

export interface SessionConfig {
  agentId?: string
  signedUrl?: string
  textOnly: boolean
  orchestration?: { sessionId?: string }
}
