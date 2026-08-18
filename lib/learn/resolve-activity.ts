import { validateActivityProps, type ActivityTypeKey } from '@/lib/content/schemas'
import {
  sliceActivityPropsToRound,
  type ActivityRoundMetadata,
  type SliceRoundOptions,
} from '@/features/activities/sizing'
import { loadAllModules } from '@/lib/knowledge/load-all'
import type { Chapter, ChapterActivity, Module } from '@/types'

export interface ResolveActivityOptions extends SliceRoundOptions {
  compact?: boolean
}

export interface ResolvedActivity {
  activity: ChapterActivity
  chapter: Chapter
  module: Module
  roundMeta?: ActivityRoundMetadata
}

export function resolveActivityById(
  activityId: string,
  options?: ResolveActivityOptions,
): ResolvedActivity | null {
  for (const mod of loadAllModules()) {
    for (const chapter of mod.chapters) {
      const activity = chapter.activities.find((a) => a.id === activityId)
      if (activity) {
        const isCompact = options?.compact !== false
        if (isCompact) {
          const { props, roundMeta } = sliceActivityPropsToRound(
            activity.type as ActivityTypeKey,
            activity.props,
            options,
          )
          return {
            activity: { ...activity, props },
            chapter,
            module: mod,
            roundMeta,
          }
        }
        return { activity, chapter, module: mod }
      }
    }
  }
  return null
}

export function resolveActivityByIdValidated(
  activityId: string,
  options?: ResolveActivityOptions,
): ResolvedActivity | null {
  const resolved = resolveActivityById(activityId, options)
  if (!resolved) return null

  const { activity } = resolved
  const result = validateActivityProps(activity.type as ActivityTypeKey, activity.props)
  if (!result.success) return null

  return resolved
}
