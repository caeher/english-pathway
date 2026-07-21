'use client'

import { useConversationClientTool } from '@elevenlabs/react'
import { executeTutorTool } from '@/lib/learn/execute-tutor-tool'

export default function TutorClientTools() {
  useConversationClientTool('showGrammar', async (params) => executeTutorTool('showGrammar', params))
  useConversationClientTool('showActivity', async (params) => executeTutorTool('showActivity', params))
  useConversationClientTool('showQuestion', async (params) => executeTutorTool('showQuestion', params))
  useConversationClientTool('clearPanel', async () => executeTutorTool('clearPanel', {}))
  useConversationClientTool('fetchCurriculumContext', async (params) => executeTutorTool('fetchCurriculumContext', params))
  useConversationClientTool('listChapterActivities', async (params) => executeTutorTool('listChapterActivities', params))
  useConversationClientTool('getPanelState', async () => executeTutorTool('getPanelState', {}))
  return null
}
