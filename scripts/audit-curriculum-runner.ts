import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseChapterActivitiesFile, validateActivityList } from '@/features/activities'
import { activityRegistry } from '@/features/activities/registry'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const knowledgeRoot = path.join(root, 'knowledge', 'modules')

function findActivityFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findActivityFiles(absolutePath)
    return entry.name === 'activities.json' ? [absolutePath] : []
  })
}

const files = findActivityFiles(knowledgeRoot)
const issues: string[] = []

for (const filePath of files) {
  const relative = path.relative(knowledgeRoot, filePath).split(path.sep)
  const moduleId = relative[0] ?? 'unknown-module'
  const chapterId = relative[2] ?? 'unknown-chapter'
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown
  const validationIssues = validateActivityList(moduleId, chapterId, raw).filter((issue) => issue.severity !== 'warning')
  issues.push(...validationIssues.map((issue) => `${filePath}: ${issue.message}`))

  const { activities } = parseChapterActivitiesFile(raw)
  for (const activity of activities) {
    if (!activity || typeof activity !== 'object') continue
    const type = (activity as { type?: string }).type
    if (type && !(type in activityRegistry)) {
      issues.push(`${filePath}: unsupported activity type ${type}`)
    }
  }
}

if (issues.length > 0) {
  console.error(`Curriculum runner audit failed with ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exitCode = 1
} else {
  console.log(`Curriculum runner audit passed for ${files.length} chapters and ${Object.keys(activityRegistry).length} activity types.`)
}
