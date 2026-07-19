import type { AuthenticatedContext } from '@/lib/api/context'
import { DomainError } from '@/lib/api/errors'
import { deletePrivateTutorData, deletePrivateTutorMemory, getPrivateTutorExport, savePrivateTutorMemory } from '@/lib/dal/tutor-memory'
import { buildTutorContext } from '@/lib/tutor/context'
import { resolveActivityByIdValidated } from '@/features/learn'
import { resolveChapter, resolveModule } from '@/features/curriculum'
import type { TutorContextRequest, TutorMemoryDeleteInput, TutorMemoryWriteInput } from './contracts'

const allowedTools = ['showGrammar', 'showActivity', 'showQuestion', 'clearPanel', 'fetchCurriculumContext'] as const

export async function getTutorActivityUseCase(activityId: string) {
  const resolved = resolveActivityByIdValidated(activityId)
  if (!resolved) throw new DomainError('NOT_FOUND', 'Activity not found')
  return { activity: resolved.activity, chapterId: resolved.chapter.id, moduleId: resolved.module.id }
}

export async function buildTutorContextUseCase(context: AuthenticatedContext | null, input: TutorContextRequest) {
  const resolvedModule = input.moduleId ? await resolveModule(input.moduleId) : null
  if (input.moduleId && !resolvedModule) throw new DomainError('NOT_FOUND', 'Module not found')
  const chapter = input.chapterId ? await resolveChapter(input.chapterId) : null
  if (input.chapterId && !chapter) throw new DomainError('NOT_FOUND', 'Chapter not found')
  if (resolvedModule && chapter && chapter.module.id !== resolvedModule.id) {
    throw new DomainError('INVALID_INPUT', 'Chapter does not belong to module')
  }

  const tutorContext = await buildTutorContext(context?.supabase ?? null, context?.userId ?? null, input)
  const matches = tutorContext.retrieval.matches.map((match, index) => ({
    id: match.citation.source === 'personal'
      ? `personal:${match.citation.memoryKey ?? index}`
      : `${match.citation.moduleId ?? 'module'}:${match.citation.chapterId ?? 'module'}:${index}`,
    content: match.content,
    similarity: match.similarity,
    metadata: match.citation,
  }))
  return { matches, context: tutorContext }
}

export async function getTutorSessionUseCase(context: AuthenticatedContext | null) {
  const [profile, progress] = context
    ? await Promise.all([
      context.supabase.from('profiles').select('level, daily_goal_minutes, preferred_mode').eq('id', context.userId).maybeSingle(),
      context.supabase.from('user_progress').select('last_chapter_id, last_activity_id').eq('user_id', context.userId).maybeSingle(),
    ])
    : [{ data: null }, { data: null }]
  const orchestration = {
    sessionId: crypto.randomUUID(),
    state: 'preparing' as const,
    allowedTools,
    instruction: 'Use only validated curriculum activity IDs and wait for an explicit activity result before advancing.',
    learner: profile.data ? { level: profile.data.level, dailyGoalMinutes: profile.data.daily_goal_minutes, preferredMode: profile.data.preferred_mode } : null,
    progress: progress.data ? { lastChapterId: progress.data.last_chapter_id, lastActivityId: progress.data.last_activity_id } : null,
  }

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!agentId) return { textOnly: true as const, configured: false as const, message: 'ElevenLabs is not configured. Text mode remains available when an agent ID is set.', orchestration }
  if (!apiKey) return { agentId, textOnly: false as const, configured: true as const, orchestration }

  const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url')
  url.searchParams.set('agent_id', agentId)
  const response = await fetch(url, { headers: { 'xi-api-key': apiKey } })
  if (!response.ok) throw new DomainError('DEPENDENCY_FAILURE', 'Tutor session could not be prepared')
  const data = (await response.json()) as { signed_url?: string }
  if (!data.signed_url) throw new DomainError('DEPENDENCY_FAILURE', 'Tutor session returned no signed URL')
  return { signedUrl: data.signed_url, textOnly: false as const, configured: true as const, orchestration }
}

export function getTutorMemoryUseCase(context: AuthenticatedContext) {
  return getPrivateTutorExport(context.supabase, context.userId)
}

export function saveTutorMemoryUseCase(context: AuthenticatedContext, input: TutorMemoryWriteInput) {
  return savePrivateTutorMemory(context.supabase, context.userId, input)
}

export function deleteTutorMemoryUseCase(context: AuthenticatedContext, input: TutorMemoryDeleteInput) {
  return input.memoryKey
    ? deletePrivateTutorMemory(context.supabase, context.userId, input.memoryKey)
    : deletePrivateTutorData(context.supabase, context.userId)
}
