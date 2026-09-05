import { getTutorSessionUseCase } from '@/features/tutor'
import { respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET(request: Request) {
  const context = await getAuthenticatedContext()
  const mode = new URL(request.url).searchParams.get('mode')
  const sessionMode = mode === 'voice' || mode === 'text' ? mode : undefined
  return respondWithApiErrors(
    () => getTutorSessionUseCase(context, { mode: sessionMode }),
    'Unable to prepare tutor session',
  )
}
