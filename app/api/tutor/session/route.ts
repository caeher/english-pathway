import { getTutorSessionUseCase, parseSessionPlanQuery } from '@/features/tutor'
import { respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET(request: Request) {
  const context = await getAuthenticatedContext()
  const params = new URL(request.url).searchParams
  const modeParam = params.get('mode')
  const mode = modeParam === 'voice' || modeParam === 'text' ? modeParam : undefined
  const plan = parseSessionPlanQuery(params.get('plan'), mode)
  return respondWithApiErrors(() => getTutorSessionUseCase(context, plan), 'Unable to prepare tutor session')
}
