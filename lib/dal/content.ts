import { createClient } from '@/lib/supabase/server'

export async function getLegalDocument(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .single()
  return data
}
