export function curriculumModuleHref(moduleId: string) {
  return `/curriculum/${encodeURIComponent(moduleId)}`
}

export function curriculumChapterHref(moduleId: string, chapterId: string) {
  return `${curriculumModuleHref(moduleId)}/${encodeURIComponent(chapterId)}`
}

export function learnHref({ moduleId, chapterId, activityId }: { moduleId: string; chapterId: string; activityId?: string | null }) {
  const params = new URLSearchParams({ moduleId, chapterId })
  if (activityId) params.set('activityId', activityId)
  return `/learn?${params.toString()}`
}
