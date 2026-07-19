import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Flame, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { getLevelProgress } from '@/lib/engagement/xp'
import { learnHref } from '@/lib/curriculum/href'
import { Badge, SectionHeader, Surface } from '@/components/ui'
import { getLearningContinuation } from '@/lib/learning/continuation'

interface DashboardData {
  profile: { full_name: string | null; daily_goal_minutes: number | null } | null
  engagement: { total_xp: number; current_streak: number; longest_streak: number } | null
  daily: { minutes: number; goalMinutes: number; goalMet: boolean }
  progress: { last_chapter_id: string | null; last_activity_id: string | null } | null
  recentActivities: Array<{ id: string; title: string; chapterTitle: string; score: number | null; status: string; updatedAt: string }>
  completedChapters: number
  dueReviews: number
  lastChapter: { module: { id: string; title: string }; chapter: { id: string; title: string } } | null
}

export default function LearnerDashboard({ data }: { data: DashboardData }) {
  const totalXp = data.engagement?.total_xp ?? 0
  const level = getLevelProgress(totalXp)
  const streak = data.engagement?.current_streak ?? 0
  const dailyPct = data.daily.goalMinutes > 0 ? Math.min(100, Math.round((data.daily.minutes / data.daily.goalMinutes) * 100)) : 0
  const firstName = data.profile?.full_name?.split(' ')[0] ?? 'Learner'
  const resume = data.lastChapter
    ? {
      moduleId: data.lastChapter.module.id,
      chapterId: data.lastChapter.chapter.id,
      activityId: data.progress?.last_activity_id ?? null,
    }
    : null
  const continuation = getLearningContinuation({ dueReviews: data.dueReviews, resume, completedChapters: data.completedChapters, totalChapters: 0 })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHeader
        eyebrow="Your learning hub"
        title={`Welcome back, ${firstName}`}
        description="Keep your momentum going with a focused practice session."
        className="[&_h2]:text-3xl"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Surface>
          <div className="flex items-center justify-between"><Sparkles className="h-5 w-5 text-(--reward)" /><Badge variant="reward">LEVEL {level.level}</Badge></div>
          <p className="mt-4 text-2xl font-black text-(--text-primary)">{totalXp} XP</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-(--bg-tertiary)"><div className="h-full rounded-full bg-(--reward)" style={{ width: `${level.progressPct}%` }} /></div>
          <p className="mt-2 text-xs text-(--text-muted)">{level.nextLevelXp - totalXp} XP to next level</p>
        </Surface>
        <Surface>
          <div className="flex items-center justify-between"><Flame className="h-5 w-5 text-(--accent)" /><Badge variant="accent">BEST {data.engagement?.longest_streak ?? 0}</Badge></div>
          <p className="mt-4 text-2xl font-black text-(--text-primary)">{streak} days</p>
          <p className="mt-2 text-xs text-(--text-muted)">Current study streak</p>
        </Surface>
        <Surface>
          <div className="flex items-center justify-between"><Trophy className="h-5 w-5 text-(--secondary)" /><Badge variant="secondary">CHAPTERS</Badge></div>
          <p className="mt-4 text-2xl font-black text-(--text-primary)">{data.completedChapters}</p>
          <p className="mt-2 text-xs text-(--text-muted)">Completed chapters</p>
        </Surface>
        <Surface>
          <div className="flex items-center justify-between"><RotateCcw className="h-5 w-5 text-(--accent)" /><Badge variant="accent">SRS</Badge></div>
          <p className="mt-4 text-2xl font-black text-(--text-primary)">{data.dueReviews}</p>
          <p className="mt-2 text-xs text-(--text-muted)">Reviews due today</p>
        </Surface>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Surface padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-sm font-bold text-(--accent)">{continuation.kind === 'review' ? 'Review due' : 'Continue learning'}</p><h2 className="mt-1 font-display text-xl font-black text-(--text-primary)">{continuation.title}</h2><p className="mt-1 text-sm text-(--text-secondary)">{continuation.description}</p></div>
            <Link href={continuation.href} className="inline-flex items-center gap-2 rounded-xl bg-(--accent) px-4 py-2 text-sm font-bold text-white no-underline hover:bg-(--accent-hover)">{continuation.label} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {data.lastChapter && <p className="mt-6 flex items-center gap-2 text-xs text-(--text-muted)"><BookOpen className="h-4 w-4" /> Your latest chapter is ready to resume.</p>}
        </Surface>
        <Surface padding="lg">
          <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-(--accent)">Daily goal</p><h2 className="mt-1 font-display text-xl font-black text-(--text-primary)">{data.daily.minutes}/{data.daily.goalMinutes} min</h2></div><div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--accent) ${dailyPct}%, var(--bg-tertiary) ${dailyPct}% 100%)` }}><div className="flex h-11 w-11 items-center justify-center rounded-full bg-(--bg-card) text-sm font-black text-(--text-primary)">{dailyPct}%</div></div></div>
          <p className="mt-4 text-sm text-(--text-secondary)">{data.daily.goalMet ? 'Goal met — excellent work today.' : `${Math.max(0, data.daily.goalMinutes - data.daily.minutes)} minutes left to reach your goal.`}</p>
        </Surface>
      </section>

      <Surface padding="lg">
        <SectionHeader title="Recent activity" description="Your latest practice results." action={<Link href="/review" className="inline-flex items-center gap-1 text-sm font-bold text-(--accent) no-underline hover:underline">Review {data.dueReviews > 0 && `(${data.dueReviews})`} <ArrowRight className="h-4 w-4" /></Link>} />
        {data.recentActivities.length === 0 ? <p className="mt-6 text-sm text-(--text-muted)">Complete an activity to see your progress here.</p> : <div className="mt-5 divide-y divide-(--border-primary)">{data.recentActivities.map((activity) => <div key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><CheckCircle2 className="h-5 w-5 shrink-0 text-(--success)" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-(--text-primary)">{activity.title}</p><p className="truncate text-xs text-(--text-muted)">{activity.chapterTitle}</p></div><span className="text-sm font-bold text-(--text-secondary)">{activity.score ?? 0}%</span></div>)}</div>}
      </Surface>
    </div>
  )
}
