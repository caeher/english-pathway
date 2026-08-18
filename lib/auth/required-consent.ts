import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

export type MissingLegalConsent = {
  legalDocumentId: string
  type: 'terms' | 'privacy'
  version: string
  slug: string
  title: string
}

export async function getMissingLegalConsentsForClient(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MissingLegalConsent[]> {
  const { data: documents, error: documentsError } = await supabase
    .from('legal_documents')
    .select('id, type, version, slug, title')
    .in('type', ['terms', 'privacy'])
    .not('published_at', 'is', null)

  if (documentsError || !documents?.length) return []

  const { data: consents, error: consentsError } = await supabase
    .from('user_consents')
    .select('legal_document_id, document_version')
    .eq('user_id', userId)

  if (consentsError) {
    console.error('[auth] failed to read user consents for re-consent check', consentsError)
    return []
  }

  const accepted = new Set(
    (consents ?? []).map((consent) => `${consent.legal_document_id}:${consent.document_version}`),
  )

  return documents
    .filter((document) => !accepted.has(`${document.id}:${document.version}`))
    .map((document) => ({
      legalDocumentId: document.id,
      type: document.type as 'terms' | 'privacy',
      version: document.version,
      slug: document.slug,
      title: document.title,
    }))
}

export async function getMissingLegalConsents(userId: string): Promise<MissingLegalConsent[]> {
  const supabase = createAdminClient()
  return getMissingLegalConsentsForClient(supabase, userId)
}

export async function userNeedsLegalReconsent(userId: string): Promise<boolean> {
  const missing = await getMissingLegalConsents(userId)
  return missing.length > 0
}
