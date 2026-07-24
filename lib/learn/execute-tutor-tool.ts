import { trackEvent } from '@/lib/analytics/events'
import {
  curriculumContextActionSchema,
  listChapterActivitiesActionSchema,
  showActivityActionSchema,
  showGrammarActionSchema,
  showQuestionActionSchema,
} from '@/lib/tutor/schemas'
import { PANEL_REJECTION_NOTICE } from '@/lib/tutor/panel-content'
import { useLearnSessionStore } from '@/stores/useLearnSessionStore'
import {
  clearPanel,
  fetchCurriculumContext,
  getPanelState,
  listChapterActivities,
  showActivity,
  showGrammar,
  showQuestion,
} from './client-tools'
import { formatCurriculumMatches } from './format-curriculum-match'

function stringifyToolOutput(output: unknown): string {
  return typeof output === 'string' ? output : JSON.stringify(output)
}

export async function executeTutorTool(name: string, rawArguments: unknown): Promise<string> {
  try {
    let result: string

    if (name === 'showGrammar') {
      const parsed = showGrammarActionSchema.safeParse(rawArguments)
      if (!parsed.success) {
        useLearnSessionStore.getState().setPanelNotice(PANEL_REJECTION_NOTICE)
        result = 'Grammar content was rejected because it was invalid or unsafe. Use structured blocks with plain text only (heading, paragraph, example, list, emphasis).'
      } else {
        showGrammar(parsed.data.blocks, parsed.data.title)
        result = 'Grammar content displayed in the learning panel.'
      }
    } else if (name === 'showActivity') {
      const parsed = showActivityActionSchema.safeParse(rawArguments)
      if (!parsed.success) {
        result = 'Activity request was rejected because its ID was invalid.'
      } else {
        const activity = await showActivity(parsed.data.activityId)
        result = `Activity "${activity.title}" is now visible in the learning panel. Chapter: ${activity.curriculumUrl}.`
      }
    } else if (name === 'showQuestion') {
      const parsed = showQuestionActionSchema.safeParse(rawArguments)
      if (!parsed.success) {
        useLearnSessionStore.getState().setPanelNotice(PANEL_REJECTION_NOTICE)
        result = 'Question request was rejected because its payload was invalid or unsafe. Use plain text only.'
      } else {
        showQuestion(parsed.data.prompt, parsed.data.options, parsed.data.correctIndex)
        result = 'Question displayed in the learning panel. Wait for the learner to select an answer.'
      }
    } else if (name === 'clearPanel') {
      const tutorState = useLearnSessionStore.getState().tutorState
      if (tutorState === 'evaluating') {
        result = 'Panel cannot be cleared while evaluating an activity result. Provide feedback first.'
      } else {
        clearPanel()
        result = 'Panel cleared.'
      }
    } else if (name === 'fetchCurriculumContext') {
      const parsed = curriculumContextActionSchema.safeParse(rawArguments)
      if (!parsed.success) {
        result = 'Curriculum lookup was rejected because its payload was invalid.'
      } else {
        const matches = await fetchCurriculumContext(parsed.data)
        result = formatCurriculumMatches(matches)
      }
    } else if (name === 'listChapterActivities') {
      const parsed = listChapterActivitiesActionSchema.safeParse(rawArguments)
      if (!parsed.success) {
        result = 'Chapter activities request was rejected because its payload was invalid.'
      } else {
        const data = await listChapterActivities(parsed.data.chapterId)
        result = `Chapter ${data.chapterId} (${data.chapterTitle}) has ${data.activities.length} activities:\n${data.activities.map((a) => `- ${a.id} (${a.type}): ${a.title}`).join('\n')}`
      }
    } else if (name === 'getPanelState') {
      result = stringifyToolOutput(getPanelState())
    } else {
      result = 'This tool is not available.'
    }

    trackEvent('learn_tool_call', { tool_name: name, success: true })
    return result
  } catch (error) {
    trackEvent('learn_tool_error', {
      tool_name: name,
      reason: error instanceof Error ? error.message : 'unknown',
    })
    return 'The requested client action could not be completed.'
  }
}
