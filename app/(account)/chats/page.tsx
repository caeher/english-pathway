import { getCurrentUser } from '@/lib/auth/actions'
import ChatsPage from '@/components/pages/ChatsPage'

export const metadata = {
  title: 'Chats — English Pathway',
  description: 'Continue your English practice conversations with the AI helper.',
}

export default async function ChatsRoutePage() {
  const user = await getCurrentUser()
  if (!user) return null

  return <ChatsPage />
}
