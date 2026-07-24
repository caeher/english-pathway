import { getSessionPlanSuggestionsUseCase } from '@/features/tutor'
import { respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET(request: Request) {
  const context = await getAuthenticatedContext()
  const modeParam = new URL(request.url).searchParams.get('mode')
  const mode = modeParam === 'voice' || modeParam === 'text' ? modeParam : undefined
  return respondWithApiErrors(() => getSessionPlanSuggestionsUseCase(context, mode), 'Unable to load session plan suggestions')
}
