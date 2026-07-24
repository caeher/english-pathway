import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateActivityList, validateCurriculumContrastPairs } from '@/features/activities'

type ActivityFileIssue = ReturnType<typeof validateActivityList>[number] & { filePath: string }

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

const curriculumActivities = findActivityFiles(knowledgeRoot).map((filePath) => {
  const relative = path.relative(knowledgeRoot, filePath).split(path.sep)
  const moduleId = relative[0] ?? 'unknown-module'
  const chapterId = relative[2] ?? 'unknown-chapter'
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown
  const activities = Array.isArray(raw) ? raw : []
  return { moduleId, chapterId, activities: activities as Array<{ type: string; props: unknown }> }
})

const globalIssues = validateCurriculumContrastPairs(curriculumActivities).map((issue) => ({
  ...issue,
  filePath: path.join(knowledgeRoot, 'curriculum'),
}))

const allIssues = [...issues, ...globalIssues]

const errors = allIssues.filter((issue): issue is ActivityFileIssue => issue.severity !== 'warning')
const warnings = allIssues.filter((issue) => issue.severity === 'warning')

if (warnings.length > 0) {
  console.warn(`Activity validation reported ${warnings.length} warning(s):`)
  for (const issue of warnings) console.warn(`- ${path.relative(root, issue.filePath)} [${issue.moduleId}/${issue.chapterId}/${issue.activityId}] ${issue.field}: ${issue.message}`)
}

if (errors.length > 0) {
  console.error(`Activity validation failed with ${errors.length} issue(s):`)
  for (const issue of errors) console.error(`- ${path.relative(root, issue.filePath)} [${issue.moduleId}/${issue.chapterId}/${issue.activityId}] ${issue.field}: ${issue.message}`)
  process.exitCode = 1
} else {
  console.log(`Activity validation passed for ${findActivityFiles(knowledgeRoot).length} chapter files.`)
}
