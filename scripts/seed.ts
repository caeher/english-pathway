import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { createAdminClient } from '../lib/supabase/admin'
import { LEGAL_DOCUMENTS } from '../lib/legal/documents'

async function seed() {
  const supabase = createAdminClient()
  console.log('Starting database seed...')

  for (const doc of LEGAL_DOCUMENTS) {
    const { error } = await supabase.from('legal_documents').upsert(
      {
        slug: doc.slug,
        type: doc.type,
        title: doc.title,
        content: doc.content,
        version: doc.version,
        locale: doc.locale,
        published_at: new Date(`${doc.effectiveDate}T00:00:00.000Z`).toISOString(),
      },
      { onConflict: 'slug' },
    )
    if (error) throw new Error(`Legal ${doc.slug}: ${error.message}`)
  }
  console.log(`Seeded ${LEGAL_DOCUMENTS.length} legal documents`)
  console.log('Curriculum lives in knowledge/ - run pnpm kb:embed for RAG.')
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
