import { getTutorSessionUseCase } from '@/features/tutor'
import { respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET() {
  const context = await getAuthenticatedContext()
  return respondWithApiErrors(() => getTutorSessionUseCase(context), 'Unable to prepare tutor session')
}
