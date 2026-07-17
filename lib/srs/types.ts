export interface ReviewContent {
  activityId: string
  activityTitle: string
  activityType: string
  chapterId: string
  chapterTitle: string
  moduleId: string
  moduleTitle: string
  prompt: string
  answer: string
  hint?: string
}

export interface ReviewSourceItem {
  contentRef: string
  content: ReviewContent
}

export interface SrsQueueItem extends ReviewSourceItem {
  id: string
  easeFactor: number
  intervalDays: number
  repetitions: number
  dueAt: string
}
