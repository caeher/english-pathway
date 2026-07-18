import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedTools = ['showGrammar', 'showActivity', 'showQuestion', 'clearPanel', 'fetchCurriculumContext'] as const

async function orchestration() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [profile, progress] = user
    ? await Promise.all([
      supabase.from('profiles').select('level, daily_goal_minutes, preferred_mode').eq('id', user.id).maybeSingle(),
      supabase.from('user_progress').select('last_chapter_id, last_activity_id').eq('user_id', user.id).maybeSingle(),
    ])
    : [{ data: null }, { data: null }]
  return {
    sessionId: crypto.randomUUID(),
    state: 'preparing' as const,
    allowedTools,
    instruction: 'Use only validated curriculum activity IDs and wait for an explicit activity result before advancing.',
    learner: profile.data ? { level: profile.data.level, dailyGoalMinutes: profile.data.daily_goal_minutes, preferredMode: profile.data.preferred_mode } : null,
    progress: progress.data ? { lastChapterId: progress.data.last_chapter_id, lastActivityId: progress.data.last_activity_id } : null,
  }
}

export async function GET() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const apiKey = process.env.ELEVENLABS_API_KEY
  const session = await orchestration()

  if (!agentId) {
    return NextResponse.json({
      textOnly: true,
      configured: false,
      message: 'ElevenLabs is not configured. Text mode remains available when an agent ID is set.',
      orchestration: session,
    })
  }

  if (apiKey) {
    const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url')
    url.searchParams.set('agent_id', agentId)
    const response = await fetch(url.toString(), { headers: { 'xi-api-key': apiKey } })
    if (!response.ok) {
      return NextResponse.json({ error: 'Tutor session could not be prepared' }, { status: 503 })
    }
    const data = (await response.json()) as { signed_url?: string }
    if (!data.signed_url) return NextResponse.json({ error: 'Tutor session returned no signed URL' }, { status: 503 })
    return NextResponse.json({ signedUrl: data.signed_url, textOnly: false, configured: true, orchestration: session })
  }

  return NextResponse.json({ agentId, textOnly: false, configured: true, orchestration: session })
}
