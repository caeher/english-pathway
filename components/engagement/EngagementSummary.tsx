'use client'

import { useEffect, useState } from 'react'
import { Flame, Sparkles, Trophy } from 'lucide-react'
import { getLevelProgress } from '@/lib/engagement/xp'
import type { EngagementUpdate } from '@/lib/engagement/client'

interface Summary {
  totalXp: number
  currentStreak: number
  longestStreak: number
  dailyMinutes: number
  dailyGoalMinutes: number
}

interface AchievementToast {
  title: string
  icon: string
}

export default function EngagementSummary() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [toast, setToast] = useState<AchievementToast | null>(null)

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    Promise.all([
      fetch(`/api/engagement/streak?timezone=${encodeURIComponent(timezone)}`).then((response) => response.ok ? response.json() as Promise<{ totalXp: number; currentStreak: number; longestStreak: number }> : null),
      fetch(`/api/engagement/daily-progress?timezone=${encodeURIComponent(timezone)}`).then((response) => response.ok ? response.json() as Promise<{ progress: { minutesStudied: number; dailyGoalMinutes: number } }> : null),
    ]).then(([streak, daily]) => {
      if (streak && daily) {
        setSummary({
          totalXp: streak.totalXp,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          dailyMinutes: daily.progress.minutesStudied,
          dailyGoalMinutes: daily.progress.dailyGoalMinutes,
        })
      }
    }).catch(() => {})

    const handleUpdate = (event: Event) => {
      const update = (event as CustomEvent<EngagementUpdate>).detail
      setSummary({
        totalXp: update.totalXp,
        currentStreak: update.currentStreak,
        longestStreak: update.longestStreak,
        dailyMinutes: update.dailyMinutes,
        dailyGoalMinutes: update.dailyGoalMinutes,
      })
      const firstAchievement = update.newAchievements[0]
      if (firstAchievement) {
        setToast({ title: firstAchievement.title, icon: firstAchievement.icon })
        window.setTimeout(() => setToast(null), 5000)
      }
    }
    window.addEventListener('engagement:updated', handleUpdate)
    return () => window.removeEventListener('engagement:updated', handleUpdate)
  }, [])

  if (!summary) return null

  const level = getLevelProgress(summary.totalXp)
  const dailyPct = summary.dailyGoalMinutes > 0
    ? Math.min(100, Math.round((summary.dailyMinutes / summary.dailyGoalMinutes) * 100))
    : 0

  return (
    <>
      <aside className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 pt-4 text-sm sm:px-6" aria-label="Learning progress">
        <div className="flex min-w-[180px] flex-1 items-center gap-3 rounded-2xl border border-(--border-primary) bg-(--bg-card) px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-(--reward)" />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2 text-xs font-bold text-(--text-secondary)">
              <span>Level {level.level}</span><span>{summary.totalXp} XP</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-(--bg-tertiary)">
              <div className="h-full rounded-full bg-(--reward) transition-all" style={{ width: `${level.progressPct}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-(--border-primary) bg-(--bg-card) px-4 py-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--accent) ${dailyPct}%, var(--bg-tertiary) ${dailyPct}% 100%)` }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-(--bg-card) text-[10px] font-black text-(--text-primary)">{dailyPct}%</div>
          </div>
          <div><p className="text-xs font-bold text-(--text-secondary)">Daily goal</p><p className="text-xs text-(--text-muted)">{summary.dailyMinutes}/{summary.dailyGoalMinutes} min</p></div>
        </div>
        <div className="flex items-center gap-2 text-(--text-secondary)"><Flame className="h-4 w-4 text-(--accent)" /> {summary.currentStreak} day streak</div>
      </aside>
      {toast && (
        <div role="status" className="fixed right-4 top-20 z-50 flex items-center gap-3 rounded-2xl border border-(--border-primary) bg-(--bg-card) px-4 py-3 shadow-lg">
          <Trophy className="h-5 w-5 text-(--reward)" />
          <span className="text-sm font-bold text-(--text-primary)">{toast.icon} {toast.title} unlocked</span>
        </div>
      )}
    </>
  )
}
