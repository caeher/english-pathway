import { NextResponse } from 'next/server'
import { getDailyProgress } from '@/lib/dal/engagement'
import { getLocalDateString, isValidTimeZone } from '@/lib/engagement/daily-goal'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const timezone = new URL(request.url).searchParams.get('timezone') ?? 'UTC'
  if (!isValidTimeZone(timezone)) return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    return NextResponse.json({ progress: await getDailyProgress(supabase, user.id, getLocalDateString(timezone)) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to load daily progress' }, { status: 500 })
  }
}
