import Landing from '@/components/pages/Landing'
import { auth } from '@clerk/nextjs/server'

export const metadata = {
  title: 'Learn English with guided practice',
  description: 'Practice English with an AI tutor, a structured curriculum, and interactive activities.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Learn English with guided practice',
    description: 'Practice English with an AI tutor, a structured curriculum, and interactive activities.',
    url: '/',
    type: 'website' as const,
  },
}

export default async function HomePage() {
  const { userId } = await auth()

  return <Landing isAuthenticated={Boolean(userId)} />
}
