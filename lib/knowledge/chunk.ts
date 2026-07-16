import type { Chapter, Module } from '@/types'

export type ChunkType =
  | 'module_summary'
  | 'objective'
  | 'content'
  | 'activity_meta'

export interface KnowledgeChunk {
  content: string
  metadata: {
    moduleId: string
    chapterId?: string
    chunkType: ChunkType
    activityId?: string
    heading?: string
  }
}

function splitContentByHeadings(content: string): Array<{ heading: string; body: string }> {
  const sections: Array<{ heading: string; body: string }> = []
  const lines = content.split('\n')
  let currentHeading = ''
  let currentBody: string[] = []

  const flush = () => {
    const body = currentBody.join('\n').trim()
    if (body || currentHeading) {
      sections.push({ heading: currentHeading, body })
    }
    currentBody = []
  }

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    if (h2 || h3) {
      flush()
      currentHeading = (h2?.[1] ?? h3?.[1] ?? '').trim()
      continue
    }
    currentBody.push(line)
  }
  flush()

  return sections.filter((s) => s.body.length > 0)
}

export function chunkModule(mod: Module): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [
    {
      content: `Module ${mod.number}: ${mod.title}\n\n${mod.description}`,
      metadata: { moduleId: mod.id, chunkType: 'module_summary' },
    },
  ]

  for (const chapter of mod.chapters) {
    chunks.push(...chunkChapter(mod.id, chapter))
  }

  return chunks
}

export function chunkChapter(moduleId: string, chapter: Chapter): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = []

  for (const objective of chapter.objectives) {
    chunks.push({
      content: `Chapter: ${chapter.title}\nObjective: ${objective}`,
      metadata: {
        moduleId,
        chapterId: chapter.id,
        chunkType: 'objective',
      },
    })
  }

  const sections = splitContentByHeadings(chapter.content)
  if (sections.length === 0 && chapter.content.trim()) {
    chunks.push({
      content: `${chapter.title}\n\n${chapter.content.trim()}`,
      metadata: {
        moduleId,
        chapterId: chapter.id,
        chunkType: 'content',
      },
    })
  } else {
    for (const section of sections) {
      const prefix = section.heading ? `## ${section.heading}\n\n` : ''
      chunks.push({
        content: `${chapter.title}\n\n${prefix}${section.body}`,
        metadata: {
          moduleId,
          chapterId: chapter.id,
          chunkType: 'content',
          heading: section.heading || undefined,
        },
      })
    }
  }

  for (const activity of chapter.activities) {
    chunks.push({
      content: `Activity: ${activity.title}\nType: ${activity.type}\n${activity.description}`,
      metadata: {
        moduleId,
        chapterId: chapter.id,
        chunkType: 'activity_meta',
        activityId: activity.id,
      },
    })
  }

  return chunks
}

export function chunkAllModules(modules: Module[]): KnowledgeChunk[] {
  return modules.flatMap((mod) => chunkModule(mod))
}
