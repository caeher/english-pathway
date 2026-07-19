import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateActivityList } from '@/features/activities'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const knowledgeRoot = path.join(root, 'knowledge', 'modules')

function findActivityFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findActivityFiles(absolutePath)
    return entry.name === 'activities.json' ? [absolutePath] : []
  })
}

const issues = findActivityFiles(knowledgeRoot).flatMap((filePath) => {
  const relative = path.relative(knowledgeRoot, filePath).split(path.sep)
  const moduleId = relative[0] ?? 'unknown-module'
  const chapterId = relative[2] ?? 'unknown-chapter'
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown
  const activities = Array.isArray(raw) ? raw : []
  return validateActivityList(moduleId, chapterId, activities).map((issue) => ({ ...issue, filePath }))
})

if (issues.length > 0) {
  console.error(`Activity validation failed with ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${path.relative(root, issue.filePath)} [${issue.moduleId}/${issue.chapterId}/${issue.activityId}] ${issue.field}: ${issue.message}`)
  process.exitCode = 1
} else {
  console.log(`Activity validation passed for ${findActivityFiles(knowledgeRoot).length} chapter files.`)
}
