// ── Quiz ──
export interface MultipleChoiceQuestion {
  id: string
  type: 'multiple-choice'
  question: string
  options: string[]
  correct: number
  explanation?: string
}

export interface FillBlankQuestion {
  id: string
  type: 'fill-blank'
  question: string
  correct: string
  explanation?: string
}

export type QuizQuestion = MultipleChoiceQuestion | FillBlankQuestion

export interface QuizResult {
  score: number
  total: number
}

// ── Games ──
export interface MatchPair {
  left: string
  right: string
}

export interface SentenceChallenge {
  prompt?: string
  words: string[]
  correct: string
}

export interface FlashcardData {
  id: string
  front: string
  back: string
  example?: string
}

export interface SVGSceneItem {
  id: string
  type: 'circle' | 'ellipse' | 'rect' | 'polygon' | 'path'
  label: string
  labelEn: string
  fill: string
  cx?: number
  cy?: number
  r?: number
  rx?: number
  ry?: number
  x?: number
  y?: number
  width?: number
  height?: number
  points?: string
  d?: string
}

export interface SVGScene {
  viewBox: string
  bg?: string
  items: SVGSceneItem[]
}

export interface WordScrambleItem {
  word: string
  hint: string
  category?: string
}

export interface ListeningItem {
  id: string
  audioText: string
  question: string
  options: string[]
  correct: number
  explanation?: string
}

export interface DictationItem {
  id: string
  audioText: string
  hint?: string
}

export interface PronunciationItem {
  id: string
  phrase: string
  hint?: string
}

export type ActivityType =
  | 'svg-scene'
  | 'flashcard'
  | 'word-match'
  | 'sentence-builder'
  | 'quiz'
  | 'word-scramble'
  | 'listening'
  | 'dictation'
  | 'pronunciation'
  | 'drag-drop'

// ── Chapter / Module ──
export interface ChapterActivity {
  id: string
  type: ActivityType
  title: string
  description: string
  props: Record<string, unknown>
}

export interface Chapter {
  id: string
  moduleId: string
  number: number
  title: string
  subtitle: string
  icon: string
  color: string
  objectives: string[]
  content: string
  activities: ChapterActivity[]
  xpReward: number
}

export interface Module {
  id: string
  number: number
  title: string
  description: string
  icon: string
  color: string
  chapters: Chapter[]
}

// ── Progress ──
export interface ActivityProgress {
  completed: boolean
  score?: number
  bestScore?: number
  attempts: number
}

export interface ChapterProgress {
  started: boolean
  completed: boolean
  xpEarned: number
  activities: Record<string, ActivityProgress>
}
