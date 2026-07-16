import {
  getChapter as getKnowledgeChapter,
  getChapterNav as getKnowledgeChapterNav,
  getModule as getKnowledgeModule,
  loadAllModules,
} from '@/lib/knowledge/load-all'
import type { Chapter, Module } from '@/types'

export async function resolveChapter(chapterId: string): Promise<{
  chapter: Chapter
  module: Module
} | null> {
  return getKnowledgeChapter(chapterId)
}

export async function resolveModule(moduleId: string): Promise<Module | null> {
  return getKnowledgeModule(moduleId)
}

export function resolveChapterNav(chapterId: string) {
  return getKnowledgeChapterNav(chapterId)
}

export async function resolveAllModules(): Promise<Module[]> {
  return loadAllModules()
}
