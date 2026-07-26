import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..', '..')

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function walkTsFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return walkTsFiles(absolutePath)
    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) return [absolutePath]
    return []
  })
}

describe('curriculum and learn separation', () => {
  it('does not build curriculum deep links into /learn', () => {
    const curriculumDir = path.join(root, 'app', '(account)', 'curriculum')
    const dashboard = readSource('components/dashboard/LearnerDashboard.tsx')
    const continuation = readSource('lib/learning/continuation.ts')
    const href = readSource('lib/curriculum/href.ts')

    expect(href).not.toContain('learnHref')
    expect(dashboard).not.toMatch(/\/learn\?/)
    expect(continuation).not.toMatch(/\/learn\?/)

    const curriculumSources = walkTsFiles(curriculumDir).map((file) => fs.readFileSync(file, 'utf8'))
    for (const source of curriculumSources) {
      expect(source).not.toMatch(/\/learn\?/)
      expect(source).not.toContain('learnHref')
    }
  })

  it('normalizes legacy learn query params on the learn route', () => {
    const learnPage = readSource('app/(learn)/learn/page.tsx')
    expect(learnPage).toContain('redirect(LEARN_PATH)')
    expect(learnPage).not.toContain('initialActivityId')
  })
})
