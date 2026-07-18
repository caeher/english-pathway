import Landing from '@/components/pages/Landing'
import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <Landing isAuthenticated={Boolean(user)} />
}
