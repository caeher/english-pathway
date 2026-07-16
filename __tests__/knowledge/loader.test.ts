import { describe, expect, it } from 'vitest'
import { loadChapterFromDisk } from '@/lib/knowledge/load-chapter'
import { chunkChapter } from '@/lib/knowledge/chunk'
import { resolveActivityById } from '@/lib/learn/resolve-activity'

describe('knowledge loader', () => {
  it('loads m1-ch1 from disk', () => {
    const chapter = loadChapterFromDisk('modulo-1', 'm1-ch1')
    expect(chapter.id).toBe('m1-ch1')
    expect(chapter.objectives.length).toBeGreaterThan(0)
    expect(chapter.activities.length).toBeGreaterThan(0)
    expect(chapter.content).toContain('Alphabet')
  })

  it('chunks chapter with metadata', () => {
    const chapter = loadChapterFromDisk('modulo-1', 'm1-ch1')
    const chunks = chunkChapter('modulo-1', chapter)
    expect(chunks.some((c) => c.metadata.chunkType === 'objective')).toBe(true)
    expect(chunks.some((c) => c.metadata.chunkType === 'content')).toBe(true)
    expect(chunks.some((c) => c.metadata.chunkType === 'activity_meta')).toBe(true)
  })
})

describe('resolveActivityById', () => {
  it('finds first activity in m1-ch1', () => {
    const chapter = loadChapterFromDisk('modulo-1', 'm1-ch1')
    const firstId = chapter.activities[0]?.id
    expect(firstId).toBeDefined()
    const resolved = resolveActivityById(firstId!)
    expect(resolved?.activity.id).toBe(firstId)
    expect(resolved?.module.id).toBe('modulo-1')
  })
})
