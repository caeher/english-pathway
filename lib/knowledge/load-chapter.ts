import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { chapterActivitySchema } from '@/lib/content/schemas'
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

export function loadChapterFromDisk(moduleId: string, chapterId: string): Chapter {
  const dir = chapterDir(moduleId, chapterId)
  const mdPath = path.join(dir, 'chapter.md')
  const activitiesPath = path.join(dir, 'activities.json')

  const { data, content } = matter(fs.readFileSync(mdPath, 'utf8'))
  const fm = data as ChapterFrontmatter

  const rawActivities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8')) as unknown[]
  const activities: ChapterActivity[] = rawActivities.map((act) => {
    const parsed = chapterActivitySchema.parse(act)
    return parsed as ChapterActivity
  })

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
