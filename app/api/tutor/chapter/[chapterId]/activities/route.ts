import { getTutorChapterActivitiesUseCase } from '@/features/tutor'
import { respondWithApiErrors } from '@/lib/api/errors'

export async function GET(
  _request: Request,
  context: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await context.params
  return respondWithApiErrors(() => getTutorChapterActivitiesUseCase(chapterId), 'Unable to load chapter activities')
}
