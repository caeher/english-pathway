'use client'

import { useConversationClientTool } from '@elevenlabs/react'
import {
  clearPanel,
  fetchCurriculumContext,
  showActivity,
  showGrammar,
  showQuestion,
} from '@/lib/learn/client-tools'
import { curriculumChapterHref } from '@/lib/curriculum/href'
import { curriculumContextActionSchema, showActivityActionSchema, showGrammarActionSchema, showQuestionActionSchema } from '@/lib/tutor/schemas'

export default function TutorClientTools() {
  useConversationClientTool('showGrammar', async (params) => {
    const parsed = showGrammarActionSchema.safeParse(params)
    if (!parsed.success) return 'Grammar content was rejected because it was invalid or unsafe.'
    showGrammar(parsed.data.markdown, parsed.data.title)
    return 'Grammar content displayed.'
  })

  useConversationClientTool('showActivity', async (params) => {
    const parsed = showActivityActionSchema.safeParse(params)
    if (!parsed.success) return 'Activity request was rejected because its ID was invalid.'
    const result = await showActivity(parsed.data.activityId)
    return `Activity "${result.title}" is now visible. Its chapter is available at ${result.curriculumUrl}.`
  })

  useConversationClientTool('showQuestion', async (params) => {
    const parsed = showQuestionActionSchema.safeParse(params)
    if (!parsed.success) return 'Question request was rejected because its payload was invalid.'
    showQuestion(parsed.data.prompt, parsed.data.options, parsed.data.correctIndex)
    return 'Question displayed.'
  })

  useConversationClientTool('clearPanel', async () => {
    clearPanel()
    return 'Panel cleared.'
  })

  useConversationClientTool('fetchCurriculumContext', async (params) => {
    const parsed = curriculumContextActionSchema.safeParse(params)
    if (!parsed.success) return 'Curriculum lookup was rejected because its payload was invalid.'
    const matches = await fetchCurriculumContext(parsed.data)
    if (matches.length === 0) return 'No relevant curriculum content found.'
    return matches
      .map((m, i) => {
        const moduleId = typeof m.metadata.moduleId === 'string' ? m.metadata.moduleId : undefined
        const chapterId = typeof m.metadata.chapterId === 'string' ? m.metadata.chapterId : undefined
        const source = moduleId && chapterId ? `\nSource: ${curriculumChapterHref(moduleId, chapterId)}` : ''
        return `[${i + 1}] (similarity ${m.similarity.toFixed(2)})${source}\n${m.content}`
      })
      .join('\n\n---\n\n')
  })

  return null
}
