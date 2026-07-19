import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const publicEntries = [
  ['learn', 'features/learn/index.ts'],
  ['activities', 'features/activities/index.ts'],
  ['curriculum', 'features/curriculum/index.ts'],
  ['progress', 'features/progress/index.ts'],
  ['srs', 'features/srs/index.ts'],
  ['engagement', 'features/engagement/index.ts'],
  ['onboarding', 'features/onboarding/index.ts'],
  ['account', 'features/account/index.ts'],
  ['tutor', 'features/tutor/index.ts'],
]

const progressBoundary = {
  internalPrefixes: [
    '@/lib/api/progress-schemas',
    '@/lib/dal/chapter-completions',
    '@/lib/dal/learning-progress',
    '@/lib/progress',
  ],
  ownerPrefixes: [
    'features/progress/',
    'lib/dal/chapter-completions.ts',
    'lib/dal/learning-progress.ts',
    'lib/progress/',
  ],
  publicPrefix: '@/features/progress',
}

const ignoredDirectories = new Set(['.git', '.next', 'node_modules'])
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

function listSourceFiles(directory) {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...listSourceFiles(absolutePath))
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(absolutePath)
  }
  return files
}

function repositoryPath(absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/')
}

function importsFrom(source) {
  const imports = []
  const pattern = /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g
  for (const match of source.matchAll(pattern)) imports.push(match[1])
  return imports
}

function startsWithAny(value, prefixes) {
  return prefixes.some((prefix) => value === prefix || value.startsWith(prefix))
}

function isOwner(file, prefixes) {
  return startsWithAny(file, prefixes)
}

function validatePublicEntries() {
  return publicEntries.flatMap(([feature, entry]) => {
    const absolutePath = path.join(root, entry)
    return fs.existsSync(absolutePath) ? [] : [`Missing public entry for ${feature}: ${entry}`]
  })
}

function validateProgressBoundary() {
  const violations = []
  for (const file of listSourceFiles(root)) {
    const relativeFile = repositoryPath(file)
    if (isOwner(relativeFile, progressBoundary.ownerPrefixes)) continue

    for (const imported of importsFrom(fs.readFileSync(file, 'utf8'))) {
      if (!startsWithAny(imported, progressBoundary.internalPrefixes)) continue
      violations.push(
        `${relativeFile} imports ${imported}; use ${progressBoundary.publicPrefix} instead`,
      )
    }
  }
  return violations
}

const errors = [...validatePublicEntries(), ...validateProgressBoundary()]
if (errors.length > 0) {
  console.error('Feature boundary check failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(`Feature boundary check passed (${publicEntries.length} public APIs, progress slice protected).`)
}
