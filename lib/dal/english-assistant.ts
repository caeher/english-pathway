import { createAdminClient } from '@/lib/supabase/admin'
import { ENGLISH_ASSISTANT_MODEL } from '@/lib/english-assistant/openai'

export async function createEnglishAssistantPromptLog(userId: string, prompt: string) {
  const { data, error } = await createAdminClient()
    .from('english_assistant_prompt_logs')
    .insert({ user_id: userId, prompt, model: ENGLISH_ASSISTANT_MODEL })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create English assistant prompt log: ${error.message}`)
  return data.id
}

export async function completeEnglishAssistantPromptLog(logId: string, response: string) {
  const { error } = await createAdminClient()
    .from('english_assistant_prompt_logs')
    .update({ response, status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', logId)

  if (error) throw new Error(`Failed to complete English assistant prompt log: ${error.message}`)
}

export async function failEnglishAssistantPromptLog(logId: string) {
  const { error } = await createAdminClient()
    .from('english_assistant_prompt_logs')
    .update({ status: 'failed', completed_at: new Date().toISOString() })
    .eq('id', logId)

  if (error) console.error('Failed to mark English assistant prompt log as failed', { logId })
}
