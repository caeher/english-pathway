import type { Chapter, Module } from '@/types'
import { loadAllModuleMeta } from './catalog'
import { loadChapterFromDisk } from './load-chapter'

interface ChapterEntry { module: Module; chapter: Chapter }
interface KnowledgeCache {
  modules: Module[]
  moduleById: Map<string, Module>
  chapterById: Map<string, ChapterEntry>
  chapterEntries: ChapterEntry[]
}

let cache: KnowledgeCache | null = null

function loadKnowledgeCache(): KnowledgeCache {
  if (cache) return cache
  const modules = loadAllModuleMeta().map((meta) => ({
    id: meta.id,
    number: meta.number,
    title: meta.title,
    description: meta.description,
    icon: meta.icon,
    color: meta.color,
    chapters: meta.chapters.map((chapterId) => loadChapterFromDisk(meta.id, chapterId)),
  }))
  const chapterEntries = modules.flatMap((module) => module.chapters.map((chapter) => ({ module, chapter })))
  cache = {
    modules,
    moduleById: new Map(modules.map((module) => [module.id, module])),
    chapterById: new Map(chapterEntries.map((entry) => [entry.chapter.id, entry])),
    chapterEntries,
  }
  return cache
}

export function loadAllModules(): Module[] {
  return loadKnowledgeCache().modules
}

export function getModule(moduleId: string): Module | null {
  return loadKnowledgeCache().moduleById.get(moduleId) ?? null
}

export function getChapter(chapterId: string): ChapterEntry | null {
  return loadKnowledgeCache().chapterById.get(chapterId) ?? null
}

export function getChapterNav(chapterId: string) {
  const entries = loadKnowledgeCache().chapterEntries
  const index = entries.findIndex((entry) => entry.chapter.id === chapterId)
  if (index !== -1) return { prev: entries[index - 1] ?? null, next: entries[index + 1] ?? null }
  return { prev: null, next: null }
}

export function clearModuleCache(): void {
  cache = null
}
