import { redirect } from 'next/navigation'
import VoiceTutorProvider from '@/components/voice/VoiceTutorProvider'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/actions'
import { LEARN_PATH } from '@/features/learn'
import { getLearnerLanguageLabel, toCefrLevel } from '@/lib/tutor/learner-profile'

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ moduleId?: string; chapterId?: string; activityId?: string }> }) {
  let profile = null
  const user = await getCurrentUser()
  if (user) {
    profile = await getCurrentProfile()
    if (!profile?.onboarding_completed_at && profile?.onboarding_status !== 'skipped') {
      redirect('/onboarding?next=%2Flearn')
    }
  }

  const params = await searchParams
  if (params.moduleId || params.chapterId || params.activityId) {
    redirect(LEARN_PATH)
  }

  const initialLearnerProfile = profile
    ? {
        level: toCefrLevel(profile.level),
        nativeLanguage: profile.native_language,
        nativeLanguageLabel: getLearnerLanguageLabel(profile.native_language),
        fullName: profile.full_name,
      }
    : null

  return <VoiceTutorProvider initialLearnerProfile={initialLearnerProfile} />
}
