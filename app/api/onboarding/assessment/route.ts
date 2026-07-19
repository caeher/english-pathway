import {
  confirmAssessmentUseCase,
  evaluateAndSaveAssessmentUseCase,
  getAssessmentVoiceSessionUseCase,
  parseAssessmentConfirmation,
  parseAssessmentEvaluation,
} from '@/features/onboarding'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function POST(request: Request) {
  const reviewing = new URL(request.url).searchParams.get('review') === '1'
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required.'), 'Authentication required.')
  const payload = parseAssessmentEvaluation(await request.json().catch(() => null))
  if (!payload.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid assessment responses.'), 'Invalid assessment responses.')
  return respondWithApiErrors(() => evaluateAndSaveAssessmentUseCase(context, payload.data, reviewing), 'Could not save the assessment.', { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  const reviewing = new URL(request.url).searchParams.get('review') === '1'
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required.'), 'Authentication required.')
  const payload = parseAssessmentConfirmation(await request.json().catch(() => null))
  if (!payload.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid confirmed level.'), 'Invalid confirmed level.')
  return respondWithApiErrors(() => confirmAssessmentUseCase(context, payload.data, reviewing), 'Could not save the confirmed level.')
}

export async function GET(request: Request) {
  const reviewing = new URL(request.url).searchParams.get('review') === '1'
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required.'), 'Authentication required.')
  return respondWithApiErrors(() => getAssessmentVoiceSessionUseCase(context, reviewing), 'Unable to prepare assessment voice session.', { headers: { 'Cache-Control': 'no-store' } })
}
