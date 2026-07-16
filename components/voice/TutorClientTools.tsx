'use client'

import { useConversationClientTool } from '@elevenlabs/react'
import {
  clearPanel,
  fetchCurriculumContext,
  showActivity,
  showGrammar,
  showQuestion,
} from '@/lib/learn/client-tools'

export default function TutorClientTools() {
  useConversationClientTool('showGrammar', async (params) => {
    const { markdown, title } = params as { markdown: string; title?: string }
    showGrammar(markdown, title)
    return 'Grammar content displayed.'
  })

  useConversationClientTool('showActivity', async (params) => {
    const { activityId } = params as { activityId: string }
    const result = await showActivity(activityId)
    return `Activity "${result.title}" is now visible.`
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
      .map((m, i) => `[${i + 1}] (similarity ${m.similarity.toFixed(2)})\n${m.content}`)
      .join('\n\n---\n\n')
  })

  return null
}
