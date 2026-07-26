export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type UsageCredits = {
  assistantMessagesRemaining: number
}

export const ACTIVE_CONVERSATION_KEY = 'english-assistant-active-id'

export const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hi! I can help you practise English grammar, vocabulary, writing, and homework. What would you like to work on?',
}

export function toDisplayMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.length > 0 ? messages : [WELCOME_MESSAGE]
}
