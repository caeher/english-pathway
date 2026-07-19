import type { AuthenticatedContext } from '@/lib/api/context'
import { DomainError } from '@/lib/api/errors'
import {
  ASSESSMENT_VERSION,
  assessmentConfirmationSchema,
  assessmentEvaluationSchema,
  evaluateAssessment,
  type AssessmentConfirmationInput,
  type AssessmentEvaluationInput,
} from './contracts'

type AssessmentProfile = { onboarding_status: string; onboarding_completed_at: string | null }

async function getAssessmentProfile(context: AuthenticatedContext): Promise<AssessmentProfile | null> {
  const { data } = await context.supabase
    .from('profiles')
    .select('onboarding_status, onboarding_completed_at')
    .eq('id', context.userId)
    .maybeSingle()
  return data
}

function isAssessmentActive(profile: AssessmentProfile | null) {
  return Boolean(profile && (!profile.onboarding_completed_at || profile.onboarding_status === 'skipped'))
}

async function assertAssessmentAccess(context: AuthenticatedContext, reviewing: boolean) {
  const profile = await getAssessmentProfile(context)
  if (!isAssessmentActive(profile) && !reviewing) throw new DomainError('CONFLICT', 'Assessment is not active.')
}

export async function evaluateAndSaveAssessmentUseCase(
  context: AuthenticatedContext,
  input: AssessmentEvaluationInput,
  reviewing: boolean,
) {
  await assertAssessmentAccess(context, reviewing)
  const result = evaluateAssessment(input.answers)
  const { error } = await context.supabase
    .from('profiles')
    .update({
      assessment_recommended_level: result.level,
      assessment_source: input.source,
      assessment_version: ASSESSMENT_VERSION,
      assessment_completed_at: new Date().toISOString(),
    })
    .eq('id', context.userId)
  if (error) throw new Error(`Could not save the assessment: ${error.message}`)
  return result
}

export async function confirmAssessmentUseCase(
  context: AuthenticatedContext,
  input: AssessmentConfirmationInput,
  reviewing: boolean,
) {
  await assertAssessmentAccess(context, reviewing)
  const { error } = await context.supabase
    .from('profiles')
    .update({
      level: input.level,
      assessment_confirmed_level: input.level,
      assessment_source: input.source,
      assessment_version: input.rubricVersion ?? ASSESSMENT_VERSION,
    })
    .eq('id', context.userId)
  if (error) throw new Error(`Could not save the confirmed level: ${error.message}`)
  return { confirmedLevel: input.level }
}

export async function getAssessmentVoiceSessionUseCase(context: AuthenticatedContext, reviewing: boolean) {
  await assertAssessmentAccess(context, reviewing)
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!agentId) return { configured: false, textFallback: true as const }
  if (!apiKey) return { agentId, configured: true as const, textOnly: false as const }

  const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url')
  url.searchParams.set('agent_id', agentId)
  const response = await fetch(url, { headers: { 'xi-api-key': apiKey }, cache: 'no-store' })
  if (!response.ok) return { configured: false, textFallback: true as const }
  const data = (await response.json()) as { signed_url?: string }
  if (!data.signed_url) return { configured: false, textFallback: true as const }
  return { configured: true as const, signedUrl: data.signed_url }
}

export function parseAssessmentEvaluation(input: unknown) {
  return assessmentEvaluationSchema.safeParse(input)
}

export function parseAssessmentConfirmation(input: unknown) {
  return assessmentConfirmationSchema.safeParse(input)
}
