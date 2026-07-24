export interface ChapterActivityRef {
  id: string
}

export function pickNextActivityId(
  activities: readonly ChapterActivityRef[],
  currentActivityId: string,
  isCompleted: (activityId: string) => boolean,
): string | null {
  if (activities.length === 0) return null

  const currentIndex = activities.findIndex((activity) => activity.id === currentActivityId)
  const searchFrom = currentIndex >= 0 ? currentIndex + 1 : 0

  for (let index = searchFrom; index < activities.length; index += 1) {
    const candidate = activities[index]
    if (!isCompleted(candidate.id)) return candidate.id
  }

  for (let index = 0; index < searchFrom; index += 1) {
    const candidate = activities[index]
    if (!isCompleted(candidate.id)) return candidate.id
  }

  return null
}

export async function resolveNextActivityId(
  chapterId: string,
  currentActivityId: string,
  listActivities: (chapterId: string) => Promise<{ activities: ChapterActivityRef[] }>,
  checkCompleted: (activityId: string) => Promise<boolean>,
): Promise<string | null> {
  const chapter = await listActivities(chapterId)
  const completionEntries = await Promise.all(
    chapter.activities.map(async (activity) => [activity.id, await checkCompleted(activity.id)] as const),
  )
  const completed = new Set(completionEntries.filter(([, done]) => done).map(([id]) => id))
  return pickNextActivityId(chapter.activities, currentActivityId, (id) => completed.has(id))
}
