import { redirect } from 'next/navigation'
import VoiceTutorProvider from '@/components/voice/VoiceTutorProvider'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/actions'
import { LEARN_PATH } from '@/features/learn'

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ moduleId?: string; chapterId?: string; activityId?: string }> }) {
  const user = await getCurrentUser()
  if (user) {
    const profile = await getCurrentProfile()
    if (!profile?.onboarding_completed_at && profile?.onboarding_status !== 'skipped') {
      redirect('/onboarding?next=%2Flearn')
    }
  }

  const params = await searchParams
  if (params.moduleId || params.chapterId || params.activityId) {
    redirect(LEARN_PATH)
  }

  return <VoiceTutorProvider />
}
