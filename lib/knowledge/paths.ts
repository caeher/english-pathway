import path from 'node:path'

export const KNOWLEDGE_ROOT = path.join(process.cwd(), 'knowledge')

export function moduleDir(moduleId: string): string {
  return path.join(KNOWLEDGE_ROOT, 'modules', moduleId)
}

export function chapterDir(moduleId: string, chapterId: string): string {
  return path.join(moduleDir(moduleId), 'chapters', chapterId)
}
