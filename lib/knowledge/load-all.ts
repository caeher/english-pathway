import type { Chapter, Module } from '@/types'
import { loadAllModuleMeta } from './catalog'
import { loadChapterFromDisk } from './load-chapter'

let cachedModules: Module[] | null = null

export function loadAllModules(): Module[] {
  if (cachedModules) return cachedModules

  const metas = loadAllModuleMeta()
  cachedModules = metas.map((meta) => {
    const chapters: Chapter[] = meta.chapters.map((chapterId) =>
      loadChapterFromDisk(meta.id, chapterId)
    )
    return {
      id: meta.id,
      number: meta.number,
      title: meta.title,
      description: meta.description,
      icon: meta.icon,
      color: meta.color,
      chapters,
    }
  })

  return cachedModules
}

export function getModule(moduleId: string): Module | null {
  return loadAllModules().find((m) => m.id === moduleId) ?? null
}

export function getChapter(chapterId: string): { module: Module; chapter: Chapter } | null {
  for (const mod of loadAllModules()) {
    const chapter = mod.chapters.find((c) => c.id === chapterId)
    if (chapter) return { module: mod, chapter }
  }
  return null
}

export function getChapterNav(chapterId: string) {
  for (const mod of loadAllModules()) {
    const idx = mod.chapters.findIndex((c) => c.id === chapterId)
    if (idx === -1) continue
    return {
      prev: idx > 0 ? { module: mod, chapter: mod.chapters[idx - 1] } : null,
      next:
        idx < mod.chapters.length - 1
          ? { module: mod, chapter: mod.chapters[idx + 1] }
          : null,
    }
  }
  return { prev: null, next: null }
}

export function clearModuleCache(): void {
  cachedModules = null
}
