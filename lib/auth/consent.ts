import { createClient } from '@/lib/supabase/server'

export async function recordUserConsents(userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('legal_documents')
    .select('id, type')
    .in('type', ['terms', 'privacy'])
    .not('published_at', 'is', null)

  if (!documents?.length) return

  const rows = documents.map((doc) => ({
    user_id: userId,
    legal_document_id: doc.id,
  }))

  await supabase.from('user_consents').upsert(rows, {
    onConflict: 'user_id,legal_document_id',
    ignoreDuplicates: true,
  })
}
