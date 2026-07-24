/**
 * Migrates drag-drop activities into word-match / sentence-builder or removes
 * redundant entries. Emits migration-report.json with per-chapter decisions.
 *
 * Usage: pnpm tsx scripts/migrate-drag-drop.ts [--dry-run]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateActivityList } from '@/features/activities'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const knowledgeRoot = path.join(root, 'knowledge', 'modules')
const reportPath = path.join(root, 'migration-report.json')
const dryRun = process.argv.includes('--dry-run')

type Pair = { left: string; right: string }
type Sentence = { prompt?: string; words: string[]; correct: string }
type Activity = {
  id: string
  type: string
  title: string
  description: string
  props: Record<string, unknown>
}

type MigrationAction = 'removed' | 'merged' | 'skipped'
type ChapterReport = {
  chapterId: string
  moduleId: string
  dragDropId: string
  mode: 'match' | 'sentence'
  action: MigrationAction
  detail: string
}

function findActivityFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findActivityFiles(absolutePath)
    return entry.name === 'activities.json' ? [absolutePath] : []
  })
}

function pairKey(pair: Pair): string {
  return `${pair.left.trim().toLowerCase()}::${pair.right.trim().toLowerCase()}`
}

function sentenceKey(sentence: Sentence): string {
  return sentence.correct.trim().toLowerCase()
}

function uniquePairs(pairs: Pair[]): Pair[] {
  const seen = new Set<string>()
  const result: Pair[] = []
  for (const pair of pairs) {
    const key = pairKey(pair)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(pair)
  }
  return result
}

function uniqueSentences(sentences: Sentence[]): Sentence[] {
  const seen = new Set<string>()
  const result: Sentence[] = []
  for (const sentence of sentences) {
    const key = sentenceKey(sentence)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(sentence)
  }
  return result
}

function pairsEqual(a: Pair[], b: Pair[]): boolean {
  if (a.length !== b.length) return false
  const keysA = a.map(pairKey).sort()
  const keysB = b.map(pairKey).sort()
  return keysA.every((key, index) => key === keysB[index])
}

function sentencesEqual(a: Sentence[], b: Sentence[]): boolean {
  if (a.length !== b.length) return false
  const keysA = a.map(sentenceKey).sort()
  const keysB = b.map(sentenceKey).sort()
  return keysA.every((key, index) => key === keysB[index])
}

function migrateChapter(
  moduleId: string,
  chapterId: string,
  activities: Activity[],
): { activities: Activity[]; reports: ChapterReport[] } {
  const reports: ChapterReport[] = []
  const dragDrop = activities.find((activity) => activity.type === 'drag-drop')
  if (!dragDrop) return { activities, reports }

  const mode = (dragDrop.props.mode as 'match' | 'sentence' | undefined) ?? 'match'
  const remaining = activities.filter((activity) => activity.id !== dragDrop.id)

  if (mode === 'match') {
    const dragPairs = (dragDrop.props.pairs ?? []) as Pair[]
    const wordMatch = remaining.find((activity) => activity.type === 'word-match')

    if (!wordMatch) {
      reports.push({
        chapterId,
        moduleId,
        dragDropId: dragDrop.id,
        mode,
        action: 'skipped',
        detail: 'No word-match activity found to merge into',
      })
      return { activities, reports }
    }

    const existingPairs = (wordMatch.props.pairs ?? []) as Pair[]
    if (pairsEqual(existingPairs, dragPairs)) {
      reports.push({
        chapterId,
        moduleId,
        dragDropId: dragDrop.id,
        mode,
        action: 'removed',
        detail: 'Pairs identical to word-match',
      })
      return { activities: remaining, reports }
    }

    const mergedPairs = uniquePairs([...existingPairs, ...dragPairs])
    wordMatch.props = { pairs: mergedPairs }
    reports.push({
      chapterId,
      moduleId,
      dragDropId: dragDrop.id,
      mode,
      action: 'merged',
      detail: `Merged ${mergedPairs.length - existingPairs.length} unique pair(s) into word-match`,
    })
    return { activities: remaining, reports }
  }

  const dragSentences = (dragDrop.props.sentences ?? []) as Sentence[]
  const sentenceBuilder = remaining.find((activity) => activity.type === 'sentence-builder')

  if (!sentenceBuilder) {
    const newSentenceBuilder: Activity = {
      id: `${chapterId}-sentences`,
      type: 'sentence-builder',
      title: dragDrop.title || 'Build the Sentence',
      description: dragDrop.description || 'Put the words in the correct order.',
      props: { sentences: dragSentences },
    }
    reports.push({
      chapterId,
      moduleId,
      dragDropId: dragDrop.id,
      mode,
      action: 'merged',
      detail: 'Created sentence-builder from drag-drop sentence content',
    })
    return { activities: [...remaining, newSentenceBuilder], reports }
  }

  const existingSentences = (sentenceBuilder.props.sentences ?? []) as Sentence[]
  if (sentencesEqual(existingSentences, dragSentences)) {
    reports.push({
      chapterId,
      moduleId,
      dragDropId: dragDrop.id,
      mode,
      action: 'removed',
      detail: 'Sentences identical to sentence-builder',
    })
    return { activities: remaining, reports }
  }

  const mergedSentences = uniqueSentences([...existingSentences, ...dragSentences])
  sentenceBuilder.props = { sentences: mergedSentences }
  reports.push({
    chapterId,
    moduleId,
    dragDropId: dragDrop.id,
    mode,
    action: 'merged',
    detail: `Merged ${mergedSentences.length - existingSentences.length} unique sentence(s) into sentence-builder`,
  })
  return { activities: remaining, reports }
}

const allReports: ChapterReport[] = []
let migratedFiles = 0

for (const filePath of findActivityFiles(knowledgeRoot)) {
  const relative = path.relative(knowledgeRoot, filePath).split(path.sep)
  const moduleId = relative[0] ?? 'unknown-module'
  const chapterId = relative[2] ?? 'unknown-chapter'
  const activities = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Activity[]

  const { activities: nextActivities, reports } = migrateChapter(moduleId, chapterId, activities)
  if (reports.length === 0) continue

  allReports.push(...reports)
  const issues = validateActivityList(moduleId, chapterId, nextActivities)
  if (issues.length > 0) {
    console.error(`Validation failed for ${chapterId}:`, issues)
    process.exitCode = 1
    continue
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, `${JSON.stringify(nextActivities, null, 2)}\n`)
  }
  migratedFiles++
  console.log(`${dryRun ? '[dry-run] ' : ''}${chapterId}: ${reports.map((report) => report.action).join(', ')}`)
}

const summary = {
  generatedAt: new Date().toISOString(),
  dryRun,
  chaptersProcessed: migratedFiles,
  removed: allReports.filter((report) => report.action === 'removed').length,
  merged: allReports.filter((report) => report.action === 'merged').length,
  skipped: allReports.filter((report) => report.action === 'skipped').length,
  chapters: allReports,
}

if (!dryRun) {
  fs.writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`)
}

console.log(`\nDone. ${migratedFiles} chapter(s) migrated.`)
console.log(`Removed: ${summary.removed}, merged: ${summary.merged}, skipped: ${summary.skipped}`)
if (!dryRun) console.log(`Report written to ${path.relative(root, reportPath)}`)
