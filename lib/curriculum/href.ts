export function curriculumModuleHref(moduleId: string) {
  return `/curriculum/${encodeURIComponent(moduleId)}`
}

export function curriculumChapterHref(moduleId: string, chapterId: string) {
  return `${curriculumModuleHref(moduleId)}/${encodeURIComponent(chapterId)}`
}
