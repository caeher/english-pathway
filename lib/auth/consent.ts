import { createClient } from '@/lib/supabase/server'

export async function recordUserConsents(userId: string, consentMethod: 'registration' | 'settings' | 'explicit_reconsent' = 'registration'): Promise<void> {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('legal_documents')
    .select('id, type, version')
    .in('type', ['terms', 'privacy'])
    .not('published_at', 'is', null)

  if (!documents?.length) return

  const rows = documents.map((doc) => ({
    user_id: userId,
    legal_document_id: doc.id,
    document_version: doc.version,
    consent_method: consentMethod,
  }))

  await supabase.from('user_consents').upsert(rows, {
    onConflict: 'user_id,legal_document_id,document_version',
    ignoreDuplicates: true,
  })
}
