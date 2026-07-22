'use client'

import { useEffect, useState } from 'react'
import { getActiveStreak } from '@/lib/engagement/streak'
import { getLocalDateString } from '@/lib/engagement/daily-goal'

interface CurrentStreakProps {
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
}

export function CurrentStreak({ currentStreak, longestStreak, lastStudyDate }: CurrentStreakProps) {
  // The dashboard is rendered on the server, which has no reliable knowledge of
  // the learner's timezone. Start with the server-safe UTC value, then reconcile
  // it in the browser and at each subsequent learner-local midnight.
  const [streak, setStreak] = useState(() => getActiveStreak(currentStreak, lastStudyDate, getLocalDateString('UTC')))

  useEffect(() => {
    let timer: number | undefined

    const refresh = () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      setStreak(getActiveStreak(currentStreak, lastStudyDate, getLocalDateString(timezone)))

      const now = new Date()
      const nextMidnight = new Date(now)
      nextMidnight.setHours(24, 0, 1, 0)
      timer = window.setTimeout(refresh, nextMidnight.getTime() - now.getTime())
    }

    refresh()

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [currentStreak, lastStudyDate])

  return <>
    <p className="mt-4 text-2xl font-black text-(--text-primary)">{streak} days</p>
    <p className="mt-2 text-xs text-(--text-muted)">A streak grows on each day you record learning activity.</p>
    <span className="sr-only">Your best streak is {longestStreak} days.</span>
  </>
}
