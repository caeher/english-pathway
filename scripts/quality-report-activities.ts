import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dimensionLabel, evaluateChapterQuality, evaluateModuleQuality } from '@/features/activities/quality'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const knowledgeRoot = path.join(root, 'knowledge', 'modules')

function findActivityFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findActivityFiles(absolutePath)
    return entry.name === 'activities.json' ? [absolutePath] : []
  })
}

function loadChapters() {
  return findActivityFiles(knowledgeRoot).map((filePath) => {
    const relative = path.relative(knowledgeRoot, filePath).split(path.sep)
    const moduleId = relative[0] ?? 'unknown-module'
    const chapterId = relative[2] ?? 'unknown-chapter'
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown
    const activities = Array.isArray(raw) ? raw : []
    return { moduleId, chapterId, activities, filePath }
  })
}

const chapters = loadChapters()
const chaptersByModule = new Map<string, typeof chapters>()

for (const chapter of chapters) {
  const group = chaptersByModule.get(chapter.moduleId) ?? []
  group.push(chapter)
  chaptersByModule.set(chapter.moduleId, group)
}

const chapterReports = chapters.map((chapter) => ({
  ...chapter,
  report: evaluateChapterQuality({
    moduleId: chapter.moduleId,
    chapterId: chapter.chapterId,
    activities: chapter.activities,
  }),
}))

const moduleReports = [...chaptersByModule.entries()].map(([moduleId, moduleChapters]) => ({
  moduleId,
  report: evaluateModuleQuality(moduleChapters.map((chapter) => ({
    moduleId: chapter.moduleId,
    chapterId: chapter.chapterId,
    activities: chapter.activities,
  }))),
}))

const sortedChapters = [...chapterReports].sort((left, right) => left.report.chapterScore.score - right.report.chapterScore.score)
const averageScore = Math.round(
  chapterReports.reduce((sum, chapter) => sum + chapter.report.chapterScore.score, 0) / Math.max(chapterReports.length, 1),
)

console.log(`Activity quality report for ${chapterReports.length} chapters (average score: ${averageScore})`)
console.log('')

for (const chapter of sortedChapters.slice(0, 10)) {
  const { chapterScore } = chapter.report
  const weakDimensions = chapterScore.weakDimensions.map((dimension) => dimensionLabel(dimension)).join(', ') || 'none'
  const topFindings = chapterScore.activityScores
    .flatMap((activity) => activity.findings)
    .concat(chapterScore.chapterFindings)
    .slice(0, 3)
    .map((finding) => `${finding.activityId ?? 'chapter'}: ${finding.message}`)
    .join(' | ') || 'no findings'

  console.log(`- ${chapter.moduleId}/${chapter.chapterId}: ${chapterScore.score}/100 | weak: ${weakDimensions}`)
  console.log(`  ${topFindings}`)
}

console.log('')
console.log('Module coverage findings:')
for (const moduleReport of moduleReports) {
  for (const finding of moduleReport.report.moduleFindings) {
    console.log(`- ${moduleReport.moduleId}: ${finding.message}`)
  }
}
