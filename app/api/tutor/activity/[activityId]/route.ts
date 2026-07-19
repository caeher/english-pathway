import { getTutorActivityUseCase } from '@/features/tutor'
import { respondWithApiErrors } from '@/lib/api/errors'

export async function GET(
  _request: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  const { activityId } = await context.params
  return respondWithApiErrors(() => getTutorActivityUseCase(activityId), 'Unable to load activity')
}
