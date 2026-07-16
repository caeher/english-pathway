import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createEmbedding, embeddingToVectorLiteral } from '@/lib/rag/embeddings'
import type { KnowledgeChunk } from '@/lib/knowledge/chunk'
import type { Json } from '@/lib/supabase/database.types'

export interface KnowledgeMatch {
  id: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

export function hashChunkContent(content: string, metadata: Record<string, unknown>): string {
  return createHash('sha256')
    .update(content)
    .update(JSON.stringify(metadata))
    .digest('hex')
}

export async function upsertKnowledgeChunk(chunk: KnowledgeChunk): Promise<void> {
  const supabase = createAdminClient()
  const contentHash = hashChunkContent(chunk.content, chunk.metadata)
  const { embedding } = await createEmbedding(chunk.content)

  const { data: existing } = await supabase
    .from('knowledge_embeddings')
    .select('id')
    .eq('content_hash', contentHash)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('knowledge_embeddings')
      .update({
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: embeddingToVectorLiteral(embedding),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) throw new Error(`Update embedding failed: ${error.message}`)
    return
  }

  const { error } = await supabase.from('knowledge_embeddings').insert({
    content: chunk.content,
    metadata: chunk.metadata,
    content_hash: contentHash,
    embedding: embeddingToVectorLiteral(embedding),
  })
  if (error) throw new Error(`Insert embedding failed: ${error.message}`)
}

export async function matchKnowledge(
  query: string,
  options?: { matchCount?: number; filter?: Record<string, unknown> }
): Promise<KnowledgeMatch[]> {
  const supabase = createAdminClient()
  const { embedding } = await createEmbedding(query)
  const matchCount = options?.matchCount ?? 5
  const filter = (options?.filter ?? {}) as Json

  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embeddingToVectorLiteral(embedding),
    match_count: matchCount,
    filter,
  })

  if (error) throw new Error(`match_knowledge failed: ${error.message}`)

  return (data ?? []).map((row) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata as Record<string, unknown>,
    similarity: row.similarity,
  }))
}
