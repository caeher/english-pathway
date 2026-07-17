import { redirect } from 'next/navigation'
import VoiceTutorProvider from '@/components/voice/VoiceTutorProvider'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/actions'

export default async function LearnPage() {
  const user = await getCurrentUser()
  if (user) {
    const profile = await getCurrentProfile()
    if (!profile?.onboarding_completed_at) {
      redirect('/onboarding?next=%2Flearn')
    }
  }

  return <VoiceTutorProvider />
}
