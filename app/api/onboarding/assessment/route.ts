import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  ASSESSMENT_VERSION,
  assessmentAnswersSchema,
  assessmentLevelSchema,
  assessmentSourceSchema,
  evaluateAssessment,
} from '@/lib/onboarding/assessment'

const evaluationSchema = z.object({
  source: assessmentSourceSchema,
  answers: assessmentAnswersSchema,
})

const confirmationSchema = z.object({
  level: assessmentLevelSchema,
  source: assessmentSourceSchema.default('self_assessment'),
  rubricVersion: z.string().optional(),
})

async function getActiveUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_status, onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  return { supabase, user, profile }
}

function isAssessmentActive(profile: { onboarding_status: string; onboarding_completed_at: string | null } | null) {
  return Boolean(profile && (!profile.onboarding_completed_at || profile.onboarding_status === 'skipped'))
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getActiveUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const reviewing = new URL(request.url).searchParams.get('review') === '1'
  if (!isAssessmentActive(profile) && !reviewing) return NextResponse.json({ error: 'Assessment is not active.' }, { status: 409 })

  const parsed = evaluationSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid assessment responses.' }, { status: 400 })

  const result = evaluateAssessment(parsed.data.answers)
  const { error } = await supabase
    .from('profiles')
    .update({
      assessment_recommended_level: result.level,
      assessment_source: parsed.data.source,
      assessment_version: ASSESSMENT_VERSION,
      assessment_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Could not save the assessment.' }, { status: 500 })
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  const { supabase, user, profile } = await getActiveUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const reviewing = new URL(request.url).searchParams.get('review') === '1'
  if (!isAssessmentActive(profile) && !reviewing) return NextResponse.json({ error: 'Assessment is not active.' }, { status: 409 })

  const parsed = confirmationSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid confirmed level.' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({
      level: parsed.data.level,
      assessment_confirmed_level: parsed.data.level,
      assessment_source: parsed.data.source,
      assessment_version: parsed.data.rubricVersion ?? ASSESSMENT_VERSION,
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Could not save the confirmed level.' }, { status: 500 })
  return NextResponse.json({ confirmedLevel: parsed.data.level })
}

export async function GET(request: Request) {
  const { user, profile } = await getActiveUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const reviewing = new URL(request.url).searchParams.get('review') === '1'
  if (!isAssessmentActive(profile) && !reviewing) return NextResponse.json({ error: 'Assessment is not active.' }, { status: 409 })

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!agentId || !apiKey) {
    return NextResponse.json({ configured: false, textFallback: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url')
  url.searchParams.set('agent_id', agentId)
  const response = await fetch(url, { headers: { 'xi-api-key': apiKey }, cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ configured: false, textFallback: true }, { headers: { 'Cache-Control': 'no-store' } })

  const data = (await response.json()) as { signed_url?: string }
  if (!data.signed_url) return NextResponse.json({ configured: false, textFallback: true })
  return NextResponse.json({ configured: true, signedUrl: data.signed_url }, { headers: { 'Cache-Control': 'no-store' } })
}
