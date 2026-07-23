import { saveActivityProgressUseCase } from '@/features/progress/use-cases'
import { activityProgressSchema } from '@/features/progress/contracts'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { getActivityCompletionStatus } from '@/features/progress'

export async function GET(request: Request) {
  const activityId = new URL(request.url).searchParams.get('activityId')
  if (!activityId) return apiErrorResponse(new DomainError('INVALID_INPUT', 'activityId is required'), 'activityId is required')

  const context = await getAuthenticatedContext()
  if (!context) return Response.json({ completed: false })

  return respondWithApiErrors(
    async () => ({ completed: await getActivityCompletionStatus(context.supabase, context.userId, activityId) }),
    'Unable to load activity completion status',
  )
}

export async function POST(request: Request) {
  const payload = activityProgressSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid activity progress'), 'Invalid activity progress')

  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')

  return respondWithApiErrors(
    async () => ({ ok: true as const, progress: await saveActivityProgressUseCase(context, payload.data) }),
    'Unable to save activity progress',
  )
}
