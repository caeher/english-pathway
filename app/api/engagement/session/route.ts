import { NextResponse } from 'next/server'
import { engagementSessionSchema } from '@/lib/api/engagement-schemas'
import { getAchievements, recordEngagementSession } from '@/lib/dal/engagement'
import { getLocalDateString, isValidTimeZone } from '@/lib/engagement/daily-goal'
import { getXpForActivity } from '@/lib/engagement/xp'
import { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const payload = engagementSessionSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid engagement session' }, { status: 400 })
  }
  if (!isValidTimeZone(payload.data.timezone)) {
    return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const resolved = resolveActivityByIdValidated(payload.data.activityId)
  if (!resolved || resolved.activity.type !== payload.data.activityType) {
    return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
  }

  try {
    const state = await recordEngagementSession(supabase, {
      activityId: payload.data.activityId,
      xp: getXpForActivity(resolved.activity.type, payload.data.scorePercent),
      minutes: payload.data.durationMinutes,
      localDate: getLocalDateString(payload.data.timezone),
      score: payload.data.scorePercent,
    })
    const achievements = await getAchievements(supabase, user.id)
    return NextResponse.json({
      ...state,
      newAchievements: achievements.filter((achievement) => state.newAchievementIds.includes(achievement.id)),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to record engagement session' }, { status: 500 })
  }
}
