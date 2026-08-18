import { getTutorActivityUseCase } from '@/features/tutor'
import { respondWithApiErrors } from '@/lib/api/errors'

export async function GET(
  request: Request,
  context: { params: Promise<{ activityId: string }> },
) {
  const { activityId } = await context.params
  const url = new URL(request.url)
  const roundParam = url.searchParams.get('round')
  const offsetParam = url.searchParams.get('offset')
  const limitParam = url.searchParams.get('limit')
  const weakParam = url.searchParams.get('weakItems')

  const options = {
    roundIndex: roundParam !== null ? parseInt(roundParam, 10) : undefined,
    offset: offsetParam !== null ? parseInt(offsetParam, 10) : undefined,
    limit: limitParam !== null ? parseInt(limitParam, 10) : undefined,
    prioritizeItemIndexes: weakParam
      ? weakParam
          .split(',')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      : undefined,
  }

  return respondWithApiErrors(
    () => getTutorActivityUseCase(activityId, options),
    'Unable to load activity',
  )
}
