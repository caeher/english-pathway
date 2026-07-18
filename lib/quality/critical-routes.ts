export const criticalJourneys = [
  { id: 'visitor-to-learn', label: 'Visitor → register/confirm → onboarding → Learn', requiresProvider: true },
  { id: 'auth-recovery', label: 'Login/logout and password reset', requiresProvider: true },
  { id: 'curriculum-resume', label: 'Curriculum → activity → progress → resume', requiresProvider: true },
  { id: 'tutor-degraded', label: 'Learn without ElevenLabs or RAG', requiresProvider: false },
  { id: 'microphone-lifecycle', label: 'Voice session with and without microphone permission', requiresProvider: true },
  { id: 'legal-consent', label: 'Legal pages and consent choices', requiresProvider: false },
] as const

export const qualityBudgets = {
  public: { lcpMs: 2500, inpMs: 200, cls: 0.1, clientJsKb: 220 },
  authenticated: { lcpMs: 3000, inpMs: 200, cls: 0.1, clientJsKb: 320 },
  ragRequestMs: 2500,
} as const
