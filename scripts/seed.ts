import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { createAdminClient } from '../lib/supabase/admin'

const LEGAL_DOCUMENTS = [
  {
    slug: 'terms',
    type: 'terms' as const,
    title: 'Terms of Service',
    version: '1.0',
    locale: 'en',
    content: `# Terms of Service

Welcome to English Pathway. By using our platform, you accept these terms.

## 1. Use of the service
The platform is intended for interactive English learning with an AI tutor.

## 2. User accounts
You are responsible for keeping your credentials confidential.

## 3. Educational content
All content is owned by English Pathway and protected by copyright.

## 4. Changes
We may update these terms and will notify you of significant changes.`,
  },
  {
    slug: 'privacy',
    type: 'privacy' as const,
    title: 'Privacy Policy',
    version: '1.0',
    locale: 'en',
    content: `# Privacy Policy

English Pathway respects your privacy.

## Data we collect
- Registration information (email, name)
- Platform usage analytics

## How we use data
We use your data to personalize your experience and improve our services.

## Your rights
You may request access, correction, or deletion of your personal data at any time.`,
  },
  {
    slug: 'cookies',
    type: 'cookies' as const,
    title: 'Cookie Policy',
    version: '1.0',
    locale: 'en',
    content: `# Cookie Policy

We use cookies to improve your experience on English Pathway.

## Types of cookies
- **Essential**: required for session functionality
- **Preferences**: theme and interface settings
- **Analytics**: help us understand platform usage

## Managing cookies
You can configure your browser to reject cookies, though some features may be unavailable.`,
  },
]

async function seed() {
  const supabase = createAdminClient()
  console.log('🌱 Starting database seed...')

  for (const doc of LEGAL_DOCUMENTS) {
    const { error } = await supabase.from('legal_documents').upsert(
      {
        slug: doc.slug,
        type: doc.type,
        title: doc.title,
        content: doc.content,
        version: doc.version,
        locale: doc.locale,
        published_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
    if (error) throw new Error(`Legal ${doc.slug}: ${error.message}`)
  }
  console.log(`  ✓ ${LEGAL_DOCUMENTS.length} legal documents`)

  console.log('✅ Seed completed successfully!')
  console.log('   Curriculum lives in knowledge/ — run pnpm kb:embed for RAG.')
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
