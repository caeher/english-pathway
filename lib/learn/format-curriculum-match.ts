import { curriculumChapterHref } from '@/lib/curriculum/href'

export interface CurriculumMatch {
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

export function formatCurriculumMatch(match: CurriculumMatch, index: number): string {
  const moduleId = typeof match.metadata.moduleId === 'string' ? match.metadata.moduleId : undefined
  const chapterId = typeof match.metadata.chapterId === 'string' ? match.metadata.chapterId : undefined
  const activityId = typeof match.metadata.activityId === 'string' ? match.metadata.activityId : undefined
  const chunkType = typeof match.metadata.chunkType === 'string' ? match.metadata.chunkType : undefined

  const lines = [`[${index + 1}] (similarity ${match.similarity.toFixed(2)})`]
  if (moduleId && chapterId) lines.push(`Chapter: ${chapterId} | Module: ${moduleId}`)
  if (activityId) lines.push(`Activity ID: ${activityId} (use with showActivity)`)
  if (chunkType) lines.push(`Type: ${chunkType}`)
  if (moduleId && chapterId) lines.push(`Source: ${curriculumChapterHref(moduleId, chapterId)}`)
  lines.push(match.content)
  return lines.join('\n')
}

export function formatCurriculumMatches(matches: CurriculumMatch[]): string {
  if (matches.length === 0) return 'No relevant curriculum content found.'
  return matches.map((match, index) => formatCurriculumMatch(match, index)).join('\n\n---\n\n')
}
