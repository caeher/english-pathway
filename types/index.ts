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

export interface WordScrambleItem {
  word: string
  hint: string
  category?: string
}

export interface CuratedAudio {
  src: string
  transcript: string
  speaker?: string
  accent?: string
  defaultRate?: number
  altText?: string
}

export type AudioPracticeMode = 'guided' | 'evaluation'

export interface ContrastPair {
  label: string
  wordA: string
  wordB: string
  phoneme: string
  tip: string
}

export interface ListeningItem {
  id: string
  audioText: string
  audio?: CuratedAudio
  mode?: AudioPracticeMode
  question: string
  options: string[]
  correct: number
  explanation?: string
}

export interface DictationItem {
  id: string
  audioText: string
  audio?: CuratedAudio
  hint?: string
}

export interface PronunciationItem {
  id: string
  phrase: string
  audio?: CuratedAudio
  contrastPair?: ContrastPair
  hint?: string
}

export type PragmaticRating = 'optimal' | 'acceptable' | 'inappropriate'
export type GrammaticalRating = 'correct' | 'incorrect'

export interface BranchingDialogueChoice {
  id: string
  text: string
  nextNodeId: string
  pragmaticRating: PragmaticRating
  grammaticalRating?: GrammaticalRating
  consequence?: string
  explanation: string
}

export interface BranchingDialogueNode {
  id: string
  speakerId?: string
  intention: string
  prompt: string
  audio?: CuratedAudio
  choices: BranchingDialogueChoice[]
  isTerminal?: boolean
}

export interface BranchingDialogueCharacter {
  id: string
  name: string
  role?: string
}

export interface BranchingDialogueProps {
  setting: string
  characters?: BranchingDialogueCharacter[]
  startNodeId: string
  nodes: BranchingDialogueNode[]
}

export type ActivityType =
  | 'flashcard'
  | 'word-match'
  | 'sentence-builder'
  | 'quiz'
  | 'word-scramble'
  | 'listening'
  | 'dictation'
  | 'pronunciation'
  | 'branching-dialogue'

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
