import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>

export async function getCompletedChapterIds(supabase: Client, userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('chapter_completions')
    .select('chapter_id')
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to load chapter completions: ${error.message}`)
  return new Set((data ?? []).map((row) => row.chapter_id))
}

export async function completeChapter(supabase: Client, userId: string, chapterId: string) {
  const { data, error } = await supabase
    .from('chapter_completions')
    .upsert({ user_id: userId, chapter_id: chapterId }, { onConflict: 'user_id,chapter_id' })
    .select('chapter_id, completed_at')
    .single()

  if (error) throw new Error(`Failed to complete chapter: ${error.message}`)
  return data
}
