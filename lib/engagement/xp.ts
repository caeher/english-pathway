import type { ActivityType } from '@/types'

const BASE_XP: Record<ActivityType, number> = {
  'flashcard': 8,
  'quiz': 12,
  'word-match': 10,
  'sentence-builder': 12,
  'svg-scene': 10,
  'word-scramble': 10,
  'listening': 12,
  'dictation': 14,
  'pronunciation': 10,
  'drag-drop': 12,
}

export function getXpForActivity(activityType: ActivityType, scorePercent: number): number {
  const score = Math.max(0, Math.min(100, Math.round(scorePercent)))
  return BASE_XP[activityType] + Math.round(score / 20)
}

export function getLevelProgress(totalXp: number) {
  const safeXp = Math.max(0, Math.floor(totalXp))
  const level = Math.floor(safeXp / 100) + 1
  const currentLevelXp = (level - 1) * 100
  const nextLevelXp = level * 100
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressPct: Math.round(((safeXp - currentLevelXp) / 100) * 100),
  }
}
