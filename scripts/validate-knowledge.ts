import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { load as loadYaml } from 'js-yaml'
import { z } from 'zod'
import { validateActivityList } from '@/features/activities'

const root = process.cwd()
const modulesRoot = path.join(root, 'knowledge', 'modules')
const catalogPath = path.join(root, 'knowledge', 'catalog.yaml')
const issueList: string[] = []
const seenChapterIds = new Set<string>()
const seenModuleNumbers = new Set<number>()

const catalogSchema = z.object({ modules: z.array(z.string().min(1)).min(1) })
const moduleSchema = z.object({
  id: z.string().min(1), number: z.number().int().positive(), title: z.string().min(1),
  description: z.string().min(1), icon: z.string().min(1), color: z.string().regex(/^#[0-9a-f]{6}$/i),
  chapters: z.array(z.string().min(1)).min(1),
})
const chapterSchema = z.object({
  id: z.string().min(1), moduleId: z.string().min(1), number: z.number().int().positive(),
  title: z.string().min(1), subtitle: z.string().min(1), icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i), objectives: z.array(z.string().min(1)).min(1), xpReward: z.number().int().nonnegative(),
})

function issue(file: string, field: string, expected: string) {
  issueList.push(`${path.relative(root, file)} [${field}]: ${expected}`)
}
function parse<T>(schema: z.ZodType<T>, input: unknown, file: string): T | null {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  for (const problem of result.error.issues) issue(file, problem.path.join('.') || 'root', problem.message)
  return null
}
function readYaml(file: string): unknown {
  try { return loadYaml(fs.readFileSync(file, 'utf8')) } catch (error) { issue(file, 'yaml', error instanceof Error ? error.message : 'Invalid YAML'); return null }
}
function duplicates(values: string[]) { return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))] }

const catalog = parse(catalogSchema, readYaml(catalogPath), catalogPath)
if (catalog) {
  for (const duplicate of duplicates(catalog.modules)) issue(catalogPath, 'modules', `duplicate module id "${duplicate}"`)
  const directories = fs.readdirSync(modulesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  for (const directory of directories.filter((id) => !catalog.modules.includes(id))) issue(path.join(modulesRoot, directory), 'module', 'orphaned module directory not listed in catalog.yaml')
  for (const moduleId of catalog.modules) {
    const modulePath = path.join(modulesRoot, moduleId)
    const metadataPath = path.join(modulePath, 'module.yaml')
    if (!fs.existsSync(metadataPath)) { issue(metadataPath, 'file', 'required module metadata file is missing'); continue }
    const metadata = parse(moduleSchema, readYaml(metadataPath), metadataPath)
    if (!metadata) continue
    if (metadata.id !== moduleId) issue(metadataPath, 'id', `must equal catalog module id "${moduleId}"`)
    if (seenModuleNumbers.has(metadata.number)) issue(metadataPath, 'number', `duplicate module number "${metadata.number}"`)
    seenModuleNumbers.add(metadata.number)
    for (const duplicate of duplicates(metadata.chapters)) issue(metadataPath, 'chapters', `duplicate chapter id "${duplicate}"`)
    const chaptersPath = path.join(modulePath, 'chapters')
    const chapterNumbers = new Set<number>()
    const chapterDirectories = fs.existsSync(chaptersPath) ? fs.readdirSync(chaptersPath, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : []
    for (const chapterId of chapterDirectories.filter((id) => !metadata.chapters.includes(id))) issue(path.join(chaptersPath, chapterId), 'chapter', 'orphaned chapter directory not listed in module.yaml')
    for (const chapterId of metadata.chapters) {
      const chapterPath = path.join(chaptersPath, chapterId)
      const markdownPath = path.join(chapterPath, 'chapter.md')
      const activitiesPath = path.join(chapterPath, 'activities.json')
      if (!fs.existsSync(markdownPath)) { issue(markdownPath, 'file', 'required chapter file is missing'); continue }
      if (!fs.existsSync(activitiesPath)) issue(activitiesPath, 'file', 'required activities file is missing')
      const frontmatter = parse(chapterSchema, matter(fs.readFileSync(markdownPath, 'utf8')).data, markdownPath)
      if (frontmatter) {
        if (frontmatter.id !== chapterId) issue(markdownPath, 'id', `must equal directory chapter id "${chapterId}"`)
        if (frontmatter.moduleId !== moduleId) issue(markdownPath, 'moduleId', `must equal module id "${moduleId}"`)
        if (seenChapterIds.has(frontmatter.id)) issue(markdownPath, 'id', `duplicate chapter id "${frontmatter.id}"`)
        seenChapterIds.add(frontmatter.id)
        if (chapterNumbers.has(frontmatter.number)) issue(markdownPath, 'number', `duplicate chapter number "${frontmatter.number}" in module`)
        chapterNumbers.add(frontmatter.number)
      }
      if (fs.existsSync(activitiesPath)) {
        try {
          const activities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8')) as unknown
          if (!Array.isArray(activities)) issue(activitiesPath, 'root', 'must be an array of activities')
          else for (const activityIssue of validateActivityList(moduleId, chapterId, activities)) issue(activitiesPath, `${activityIssue.activityId}.${activityIssue.field}`, activityIssue.message)
        } catch (error) { issue(activitiesPath, 'json', error instanceof Error ? error.message : 'Invalid JSON') }
      }
    }
  }
}

if (issueList.length) {
  console.error(`Knowledge validation failed with ${issueList.length} issue(s):`)
  for (const item of issueList) console.error(`- ${item}`)
  process.exitCode = 1
} else console.log('Knowledge validation passed.')
