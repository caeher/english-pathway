import { NextResponse } from 'next/server'
import { getEngagementState } from '@/lib/dal/engagement'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    const state = await getEngagementState(supabase, user.id)
    return NextResponse.json({
      currentStreak: state?.current_streak ?? 0,
      longestStreak: state?.longest_streak ?? 0,
      totalXp: state?.total_xp ?? 0,
      lastStudyDate: state?.last_study_date ?? null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to load streak' }, { status: 500 })
  }
}
