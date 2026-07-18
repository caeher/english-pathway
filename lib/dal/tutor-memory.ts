import type { SupabaseClient } from '@supabase/supabase-js'
import type { TutorMemoryWrite } from '@/lib/api/tutor-memory-schemas'
import type { Database } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>

export async function getPrivateTutorMemory(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from('learner_memory')
    .select('memory_key, content, source, strategy_version, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(`Failed to load private tutor memory: ${error.message}`)
  return data ?? []
}

export async function getPrivateTutorExport(supabase: Client, userId: string) {
  const [summaries, memories] = await Promise.all([
    supabase.from('tutor_session_summaries').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
    supabase.from('learner_memory').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
  ])
  if (summaries.error) throw new Error(`Failed to export tutor summaries: ${summaries.error.message}`)
  if (memories.error) throw new Error(`Failed to export learner memory: ${memories.error.message}`)
  return { sessionSummaries: summaries.data ?? [], learnerMemory: memories.data ?? [] }
}

export async function savePrivateTutorMemory(supabase: Client, userId: string, write: TutorMemoryWrite) {
  if (write.type === 'session_summary') {
    const { data, error } = await supabase
      .from('tutor_session_summaries')
      .upsert({
        user_id: userId,
        correlation_id: write.correlationId,
        state: write.state,
        summary: write.summary,
        last_activity_id: write.lastActivityId ?? null,
      }, { onConflict: 'user_id,correlation_id' })
      .select('*')
      .single()
    if (error) throw new Error(`Failed to save tutor summary: ${error.message}`)
    return data
  }

  const { data, error } = await supabase
    .from('learner_memory')
    .upsert({
      user_id: userId,
      memory_key: write.memoryKey,
      content: write.content,
      source: write.source,
    }, { onConflict: 'user_id,memory_key' })
    .select('*')
    .single()
  if (error) throw new Error(`Failed to save learner memory: ${error.message}`)
  return data
}

export async function deletePrivateTutorMemory(supabase: Client, userId: string, memoryKey?: string) {
  const query = supabase.from('learner_memory').delete().eq('user_id', userId)
  const { error } = memoryKey ? await query.eq('memory_key', memoryKey) : await query
  if (error) throw new Error(`Failed to delete learner memory: ${error.message}`)
}

export async function deletePrivateTutorData(supabase: Client, userId: string) {
  const [summaries, memories] = await Promise.all([
    supabase.from('tutor_session_summaries').delete().eq('user_id', userId),
    supabase.from('learner_memory').delete().eq('user_id', userId),
  ])
  if (summaries.error) throw new Error(`Failed to delete tutor summaries: ${summaries.error.message}`)
  if (memories.error) throw new Error(`Failed to delete learner memory: ${memories.error.message}`)
}
