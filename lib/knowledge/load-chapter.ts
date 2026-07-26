import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import {
  chapterActivitySchema,
  parseChapterActivitiesFile,
  resolveActivityAdvanceFields,
} from '@/features/activities'
import type { Chapter, ChapterActivity } from '@/types'
import { chapterDir } from './paths'

interface ChapterFrontmatter {
  id: string
  moduleId: string
  number: number
  title: string
  subtitle: string
  icon: string
  color: string
  objectives: string[]
  xpReward: number
}

export function parseChapterActivities(raw: unknown): ChapterActivity[] {
  const { activities: rawActivities } = parseChapterActivitiesFile(raw)
  return rawActivities.map((act) => {
    const parsed = chapterActivitySchema.parse(act)
    const advance = resolveActivityAdvanceFields({
      required: parsed.required,
      policy: parsed.policy,
    })
    return {
      id: parsed.id,
      type: parsed.type,
      title: parsed.title,
      description: parsed.description,
      required: advance.required,
      policy: advance.policy,
      props: parsed.props as Record<string, unknown>,
    }
  })
}

export function loadChapterFromDisk(moduleId: string, chapterId: string): Chapter {
  const dir = chapterDir(moduleId, chapterId)
  const mdPath = path.join(dir, 'chapter.md')
  const activitiesPath = path.join(dir, 'activities.json')

  const { data, content } = matter(fs.readFileSync(mdPath, 'utf8'))
  const fm = data as ChapterFrontmatter

  const rawActivities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8')) as unknown
  const activities = parseChapterActivities(rawActivities)

  return {
    id: fm.id,
    moduleId: fm.moduleId,
    number: fm.number,
    title: fm.title,
    subtitle: fm.subtitle,
    icon: fm.icon,
    color: fm.color,
    objectives: fm.objectives,
    content: content.trim(),
    activities,
    xpReward: fm.xpReward,
  }
}
