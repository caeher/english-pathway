/** Public API for XP, goals, and engagement tracking. */
export { recordEngagementSession, type EngagementUpdate } from '@/lib/engagement/client'
export { computeGoalProgress, formatStudyMinutes, getLocalDateString, getTodayDateString, isValidTimeZone } from '@/lib/engagement/daily-goal'
export { getLevelProgress, getXpForActivity } from '@/lib/engagement/xp'
