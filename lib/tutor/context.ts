import type { SupabaseClient } from '@supabase/supabase-js'
import { matchKnowledge, type KnowledgeMatch } from '@/lib/dal/knowledge'
import { loadAllModules } from '@/lib/knowledge/load-all'
import { getPrivateTutorMemory } from '@/lib/dal/tutor-memory'
import type { Database } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>

export interface TutorContextRequest {
  query: string
  moduleId?: string
  chapterId?: string
  matchCount?: number
}

export interface TutorContextMatch {
  content: string
  similarity: number
  citation: { source: 'curriculum' | 'personal'; moduleId?: string; chapterId?: string; heading?: string; memoryKey?: string }
}

export interface TutorContext {
  learner: {
    level: string | null
    dailyGoalMinutes: number | null
    preferredMode: string | null
  } | null
  progress: {
    lastChapterId: string | null
    lastActivityId: string | null
    recentActivityIds: string[]
  } | null
  retrieval: {
    source: 'rag' | 'local' | 'personal' | 'composed' | 'none'
    fallbackUsed: boolean
    matches: TutorContextMatch[]
  }
}

function toCitation(metadata: Record<string, unknown>): TutorContextMatch['citation'] | null {
  if (typeof metadata.moduleId !== 'string') return null
  return {
    source: 'curriculum',
    moduleId: metadata.moduleId,
    ...(typeof metadata.chapterId === 'string' ? { chapterId: metadata.chapterId } : {}),
    ...(typeof metadata.heading === 'string' ? { heading: metadata.heading } : {}),
  }
}

function mapMatches(matches: KnowledgeMatch[]): TutorContextMatch[] {
  return matches.flatMap((match) => {
    const citation = toCitation(match.metadata)
    return citation ? [{ content: match.content.slice(0, 1800), similarity: match.similarity, citation }] : []
  })
}

export function getLocalTutorMatches(query: string, moduleId?: string, chapterId?: string, matchCount = 5): TutorContextMatch[] {
  const chapters = loadAllModules()
    .filter((module) => !moduleId || module.id === moduleId)
    .flatMap((module) => module.chapters
      .filter((chapter) => !chapterId || chapter.id === chapterId)
      .map((chapter) => ({ module, chapter })))
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2).slice(0, 12)
  return chapters
    .flatMap(({ module, chapter }) => {
      const sections = chapter.content.split(/\n(?=#{1,3}\s)/).filter(Boolean)
      return sections.map((content) => {
        const lower = content.toLowerCase()
        const score = terms.filter((term) => lower.includes(term)).length
        return { content: `${chapter.title}\n\n${content}`.slice(0, 1800), score, citation: { source: 'curriculum' as const, moduleId: module.id, chapterId: chapter.id } }
      })
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, matchCount)
    .map(({ content, score, citation }) => ({ content, similarity: score / Math.max(terms.length, 1), citation }))
}

export async function buildTutorContext(
  supabase: Client,
  userId: string | null,
  request: TutorContextRequest,
): Promise<TutorContext> {
  const [profile, progress, recentActivities] = userId
    ? await Promise.all([
      supabase.from('profiles').select('level, daily_goal_minutes, preferred_mode').eq('id', userId).maybeSingle(),
      supabase.from('user_progress').select('last_chapter_id, last_activity_id').eq('user_id', userId).maybeSingle(),
      supabase.from('activity_completions').select('activity_id').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5),
    ])
    : [{ data: null, error: null }, { data: null, error: null }, { data: [], error: null }]

  let matches: TutorContextMatch[] = []
  let source: TutorContext['retrieval']['source'] = 'none'
  let fallbackUsed = false
  try {
    const ragMatches = await matchKnowledge(request.query, {
      matchCount: Math.min(request.matchCount ?? 5, 5),
      filter: request.moduleId || request.chapterId ? { ...(request.moduleId ? { moduleId: request.moduleId } : {}), ...(request.chapterId ? { chapterId: request.chapterId } : {}) } : undefined,
    })
    matches = mapMatches(ragMatches)
    source = matches.length > 0 ? 'rag' : 'none'
  } catch {
    matches = getLocalTutorMatches(request.query, request.moduleId, request.chapterId, Math.min(request.matchCount ?? 5, 5))
    source = matches.length > 0 ? 'local' : 'none'
    fallbackUsed = true
  }

  const privateMemory = userId ? await getPrivateTutorMemory(supabase, userId) : []
  const terms = request.query.toLowerCase().split(/\s+/).filter((term) => term.length > 2).slice(0, 12)
  const privateMatches = privateMemory
    .filter((memory) => terms.some((term) => memory.content.toLowerCase().includes(term)))
    .slice(0, 3)
    .map((memory) => ({
      content: `[Private learner memory]\n${memory.content}`,
      similarity: 1,
      citation: { source: 'personal' as const, memoryKey: memory.memory_key },
    }))
  const combinedMatches = [...privateMatches, ...matches].slice(0, 8)
  if (privateMatches.length > 0 && matches.length > 0) source = 'composed'
  else if (privateMatches.length > 0) source = 'personal'

  return {
    learner: profile.data ? { level: profile.data.level, dailyGoalMinutes: profile.data.daily_goal_minutes, preferredMode: profile.data.preferred_mode } : null,
    progress: userId ? {
      lastChapterId: progress.data?.last_chapter_id ?? null,
      lastActivityId: progress.data?.last_activity_id ?? null,
      recentActivityIds: (recentActivities.data ?? []).map((item) => item.activity_id),
    } : null,
    retrieval: { source, fallbackUsed, matches: combinedMatches },
  }
}
