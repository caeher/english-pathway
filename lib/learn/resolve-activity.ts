import { validateActivityProps, type ActivityTypeKey } from '@/lib/content/schemas'
import { loadAllModules } from '@/lib/knowledge/load-all'
import type { Chapter, ChapterActivity, Module } from '@/types'

export interface ResolvedActivity {
  activity: ChapterActivity
  chapter: Chapter
  module: Module
}

export function resolveActivityById(activityId: string): ResolvedActivity | null {
  for (const mod of loadAllModules()) {
    for (const chapter of mod.chapters) {
      const activity = chapter.activities.find((a) => a.id === activityId)
      if (activity) {
        return { activity, chapter, module: mod }
      }
    }
  }
  return null
}

export function resolveActivityByIdValidated(activityId: string): ResolvedActivity | null {
  const resolved = resolveActivityById(activityId)
  if (!resolved) return null

  const { activity } = resolved
  const result = validateActivityProps(activity.type as ActivityTypeKey, activity.props)
  if (!result.success) return null

  return resolved
}
