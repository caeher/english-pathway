/**
 * Embed knowledge/ curriculum chunks into Supabase for RAG.
 * Run: pnpm kb:embed
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { chunkAllModules } from '../lib/knowledge/chunk'
import { loadAllModules } from '../lib/knowledge/load-all'
import { upsertKnowledgeChunk } from '../lib/dal/knowledge'

async function embedKnowledge() {
  const modules = loadAllModules()
  const chunks = chunkAllModules(modules)

  console.log(`📚 Embedding ${chunks.length} chunks from ${modules.length} modules...`)

  let done = 0
  const concurrency = 15
  let index = 0

  const workers = Array.from({ length: concurrency }, async () => {
    while (index < chunks.length) {
      const currentIndex = index++
      const chunk = chunks[currentIndex]
      if (chunk) {
        await upsertKnowledgeChunk(chunk)
        done++
        if (done % 25 === 0 || done === chunks.length) {
          console.log(`  ${done}/${chunks.length}`)
        }
      }
    }
  })

  await Promise.all(workers)

  console.log('✅ Knowledge embedding complete')
}

embedKnowledge().catch((err) => {
  console.error('❌ Embed failed:', err)
  process.exit(1)
})
