import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import ChatConversationPage from '@/components/pages/ChatConversationPage'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface ChatConversationRouteProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ChatConversationRouteProps) {
  const { id } = await params
  return {
    title: 'Conversation — English Pathway',
    description: 'Continue your English practice conversation with the AI helper.',
  }
}

export default async function ChatConversationRoutePage({ params }: ChatConversationRouteProps) {
  const user = await getCurrentUser()
  if (!user) return null

  const { id } = await params
  if (!UUID_PATTERN.test(id)) notFound()

  return <ChatConversationPage key={id} conversationId={id} />
}
