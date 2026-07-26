import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  COMPLETION_MODE_ACTIVITY_TYPES,
  DEFAULT_PASS_THRESHOLD,
  parseChapterActivitiesFile,
} from '@/features/activities'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const knowledgeRoot = path.join(root, 'knowledge', 'modules')
const dryRun = process.argv.includes('--dry-run')

function findActivityFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findActivityFiles(absolutePath)
    return entry.name === 'activities.json' ? [absolutePath] : []
  })
}

function migrateActivity(activity: Record<string, unknown>): Record<string, unknown> {
  const next = { ...activity }
  if (next.required === undefined) next.required = true

  const activityType = typeof next.type === 'string' ? next.type : ''
  const typeRequiresCompletion = COMPLETION_MODE_ACTIVITY_TYPES.includes(
    activityType as typeof COMPLETION_MODE_ACTIVITY_TYPES[number],
  )

  if (typeRequiresCompletion) {
    next.policy = { mode: 'completion' }
    return next
  }

  const existingPolicy = next.policy && typeof next.policy === 'object'
    ? next.policy as Record<string, unknown>
    : {}

  const mode = existingPolicy.mode === 'completion' ? 'completion' : 'score'
  if (mode === 'completion') {
    next.policy = { mode: 'completion' }
  } else {
    next.policy = {
      mode: 'score',
      passThreshold: typeof existingPolicy.passThreshold === 'number'
        ? existingPolicy.passThreshold
        : DEFAULT_PASS_THRESHOLD,
    }
  }

  return next
}

let updatedFiles = 0
let updatedActivities = 0

for (const filePath of findActivityFiles(knowledgeRoot)) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown
  const { policyVersion, activities } = parseChapterActivitiesFile(raw)
  const migrated = activities.map((activity) => {
    if (!activity || typeof activity !== 'object') return activity
    const next = migrateActivity(activity as Record<string, unknown>)
    if (JSON.stringify(next) !== JSON.stringify(activity)) updatedActivities += 1
    return next
  })

  const output = policyVersion === null
    ? migrated
    : { policyVersion: policyVersion ?? 1, activities: migrated }

  const previous = JSON.stringify(raw, null, 2)
  const nextContent = `${JSON.stringify(output, null, 2)}\n`
  if (previous.trimEnd() !== nextContent.trimEnd()) {
    updatedFiles += 1
    if (!dryRun) fs.writeFileSync(filePath, nextContent, 'utf8')
    console.log(`${dryRun ? '[dry-run] ' : ''}Updated ${path.relative(root, filePath)}`)
  }
}

console.log(`${dryRun ? 'Would update' : 'Updated'} ${updatedFiles} file(s), ${updatedActivities} activit(ies).`)
