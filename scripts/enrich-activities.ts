/**
 * Enriches chapter activities.json files with listening, dictation,
 * and pronunciation activities derived from existing content.
 *
 * Usage: pnpm tsx scripts/enrich-activities.ts [--dry-run]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateActivityList } from '@/features/activities'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const knowledgeRoot = path.join(root, 'knowledge', 'modules')
const dryRun = process.argv.includes('--dry-run')

type Activity = {
  id: string
  type: string
  title: string
  description: string
  props: Record<string, unknown>
}

const AUDIO_TYPES = ['listening', 'dictation', 'pronunciation'] as const

function findActivityFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findActivityFiles(absolutePath)
    return entry.name === 'activities.json' ? [absolutePath] : []
  })
}

function chapterIdFromPath(filePath: string): string {
  const parts = filePath.split(path.sep)
  const idx = parts.indexOf('chapters')
  return idx >= 0 ? parts[idx + 1] ?? 'unknown' : 'unknown'
}

function extractPhrases(activities: Activity[]): string[] {
  const phrases = new Set<string>()

  for (const activity of activities) {
    if (activity.type === 'flashcard') {
      const cards = (activity.props.cards ?? []) as { front: string; example?: string }[]
      for (const card of cards) {
        if (card.example && card.example.length > 2 && card.example.length < 80) phrases.add(card.example.replace(/[.!?]+$/, ''))
        if (card.front.length > 2 && card.front.length < 40 && !card.front.includes('/')) phrases.add(card.front)
      }
    }
    if (activity.type === 'word-match') {
      const pairs = (activity.props.pairs ?? []) as { left: string; right: string }[]
      for (const pair of pairs) {
        if (pair.left.length < 50) phrases.add(pair.left.replace(/[.!?]+$/, ''))
        if (pair.right.length < 50) phrases.add(pair.right.replace(/[.!?]+$/, ''))
      }
    }
    if (activity.type === 'sentence-builder') {
      const sentences = (activity.props.sentences ?? []) as { correct: string }[]
      for (const s of sentences) phrases.add(s.correct.replace(/[.!?]+$/, ''))
    }
    if (activity.type === 'word-scramble') {
      const words = (activity.props.words ?? []) as { word: string; hint: string }[]
      for (const w of words.slice(0, 4)) {
        const lower = w.word.toLowerCase()
        if (lower.length > 3) phrases.add(lower.charAt(0).toUpperCase() + lower.slice(1))
      }
    }
  }

  return [...phrases].filter((p) => p.length >= 2 && p.length <= 60)
}

function buildListening(chapterId: string, phrases: string[], title: string): Activity {
  const items = phrases.slice(0, 3).map((phrase, i) => {
    const distractors = phrases.filter((p) => p !== phrase).slice(0, 3)
    while (distractors.length < 3) distractors.push(`Option ${distractors.length + 1}`)
    const options = [phrase, ...distractors.slice(0, 3)]
    return {
      id: `l${i + 1}`,
      audioText: phrase,
      question: 'What did you hear?',
      options,
      correct: 0,
      explanation: `You heard: "${phrase}".`,
    }
  })

  return {
    id: `${chapterId}-listening`,
    type: 'listening',
    title: `${title} Listening`,
    description: 'Listen and choose the correct answer.',
    props: { items: items.length > 0 ? items : [{ id: 'l1', audioText: 'Hello', question: 'What did you hear?', options: ['Hello', 'Goodbye', 'Thanks', 'Please'], correct: 0, explanation: 'Hello is a greeting.' }] },
  }
}

function buildDictation(chapterId: string, phrases: string[]): Activity {
  const items = phrases.slice(0, 3).map((phrase, i) => ({
    id: `d${i + 1}`,
    audioText: phrase,
    hint: `From the chapter: ${titleCase(phrase.split(' ').slice(0, 3).join(' '))}...`,
  }))

  return {
    id: `${chapterId}-dictation`,
    type: 'dictation',
    title: 'Dictation Practice',
    description: 'Listen and write what you hear.',
    props: { items },
  }
}

function buildPronunciation(chapterId: string, phrases: string[]): Activity {
  const items = phrases.slice(0, 4).map((phrase, i) => ({
    id: `p${i + 1}`,
    phrase,
    hint: `Practice saying this phrase aloud — from ${chapterId}.`,
  }))

  return {
    id: `${chapterId}-pronunciation`,
    type: 'pronunciation',
    title: 'Pronunciation Practice',
    description: 'Listen and repeat the key phrases.',
    props: { items },
  }
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function chapterTitle(activities: Activity[]): string {
  const quiz = activities.find((a) => a.type === 'quiz')
  if (quiz?.title) return quiz.title.replace(/ Quiz$/, '').replace(/ Challenge$/, '')
  return 'Chapter'
}

function enrichFile(filePath: string): boolean {
  const chapterId = chapterIdFromPath(filePath)
  const relative = path.relative(knowledgeRoot, filePath).split(path.sep)
  const moduleId = relative[0] ?? 'unknown-module'

  const activities = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Activity[]
  const existingTypes = new Set(activities.map((a) => a.type))
  const missing = AUDIO_TYPES.filter((t) => !existingTypes.has(t))

  if (missing.length === 0) return false

  const phrases = extractPhrases(activities)
  const title = chapterTitle(activities)

  const newActivities: Activity[] = []

  if (missing.includes('listening')) newActivities.push(buildListening(chapterId, phrases, title))
  if (missing.includes('dictation')) newActivities.push(buildDictation(chapterId, phrases))
  if (missing.includes('pronunciation')) newActivities.push(buildPronunciation(chapterId, phrases))

  const enriched = [...activities, ...newActivities]
  const issues = validateActivityList(moduleId, chapterId, enriched)

  if (issues.length > 0) {
    console.error(`Validation failed for ${chapterId}:`, issues)
    return false
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, `${JSON.stringify(enriched, null, 2)}\n`)
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}Enriched ${chapterId}: added ${newActivities.map((a) => a.type).join(', ')}`)
  return true
}

let enriched = 0
for (const file of findActivityFiles(knowledgeRoot)) {
  if (enrichFile(file)) enriched++
}

console.log(`\nDone. ${enriched} chapter(s) enriched.`)
