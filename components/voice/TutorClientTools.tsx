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

export default function TutorClientTools() {
  useConversationClientTool('showGrammar', async (params) => {
    const { markdown, title } = params as { markdown: string; title?: string }
    showGrammar(markdown, title)
    return 'Grammar content displayed.'
  })

  useConversationClientTool('showActivity', async (params) => {
    const { activityId } = params as { activityId: string }
    const result = await showActivity(activityId)
    return `Activity "${result.title}" is now visible. Its chapter is available at ${result.curriculumUrl}.`
  })

  useConversationClientTool('showQuestion', async (params) => {
    const { prompt, options, correctIndex } = params as {
      prompt: string
      options?: string[]
      correctIndex?: number
    }
    showQuestion(prompt, options, correctIndex)
    return 'Question displayed.'
  })

  useConversationClientTool('clearPanel', async () => {
    clearPanel()
    return 'Panel cleared.'
  })

  useConversationClientTool('fetchCurriculumContext', async (params) => {
    const { query, moduleId, chapterId } = params as {
      query: string
      moduleId?: string
      chapterId?: string
    }
    const matches = await fetchCurriculumContext({ query, moduleId, chapterId })
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
