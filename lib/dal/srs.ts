import type { SupabaseClient } from '@supabase/supabase-js'
import { nextReviewDate, sm2Update, type SrsQuality } from '@/lib/srs/sm2'
import type { Database, Json } from '@/lib/supabase/database.types'
import type { ReviewSourceItem, SrsQueueItem } from '@/lib/srs/types'

type Client = SupabaseClient<Database>

function queueItem(row: Database['public']['Tables']['srs_items']['Row']): SrsQueueItem {
  return {
    id: row.id,
    contentRef: row.content_ref,
    content: row.content as unknown as SrsQueueItem['content'],
    easeFactor: Number(row.ease_factor),
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    dueAt: row.due_at,
  }
}

export async function getDueQueue(supabase: Client, userId: string, limit = 50): Promise<SrsQueueItem[]> {
  const { data, error } = await supabase
    .from('srs_items')
    .select('*')
    .eq('user_id', userId)
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`Failed to load review queue: ${error.message}`)
  return (data ?? []).map(queueItem)
}

export async function getDueCount(supabase: Client, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('srs_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('due_at', new Date().toISOString())
  if (error) throw new Error(`Failed to count due reviews: ${error.message}`)
  return count ?? 0
}

export async function enqueueReviewItems(supabase: Client, userId: string, items: ReviewSourceItem[]) {
  if (items.length === 0) return
  const refs = items.map((item) => item.contentRef)
  const { data: existing, error: existingError } = await supabase
    .from('srs_items')
    .select('content_ref')
    .eq('user_id', userId)
    .in('content_ref', refs)
  if (existingError) throw new Error(`Failed to load existing review items: ${existingError.message}`)

  const existingRefs = new Set((existing ?? []).map((row) => row.content_ref))
  const now = new Date().toISOString()
  const newItems = items.filter((item) => !existingRefs.has(item.contentRef))

  if (existingRefs.size > 0) {
    const { error } = await supabase
      .from('srs_items')
      .update({ due_at: now })
      .eq('user_id', userId)
      .in('content_ref', [...existingRefs])
    if (error) throw new Error(`Failed to reactivate review items: ${error.message}`)
  }

  if (newItems.length > 0) {
    const { error } = await supabase.from('srs_items').insert(
      newItems.map((item) => ({
        user_id: userId,
        content_ref: item.contentRef,
        content: item.content as unknown as Json,
        due_at: now,
      }))
    )
    if (error) throw new Error(`Failed to create review items: ${error.message}`)
  }
}

export async function reviewSrsItem(supabase: Client, userId: string, itemId: string, quality: SrsQuality): Promise<SrsQueueItem | null> {
  const { data, error } = await supabase
    .from('srs_items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load review item: ${error.message}`)
  if (!data) return null

  const next = sm2Update({
    easeFactor: Number(data.ease_factor),
    intervalDays: data.interval_days,
    repetitions: data.repetitions,
  }, quality)
  const { data: updated, error: updateError } = await supabase
    .from('srs_items')
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      due_at: nextReviewDate(next.intervalDays).toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (updateError) throw new Error(`Failed to update review item: ${updateError.message}`)
  return queueItem(updated)
}
