import { redirect } from 'next/navigation'
import VoiceTutorProvider from '@/components/voice/VoiceTutorProvider'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/actions'
import { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'
import { resolveChapter } from '@/lib/content/resolve'

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ moduleId?: string; chapterId?: string; activityId?: string }> }) {
  const user = await getCurrentUser()
  if (user) {
    const profile = await getCurrentProfile()
    if (!profile?.onboarding_completed_at && profile?.onboarding_status !== 'skipped') {
      redirect('/onboarding?next=%2Flearn')
    }
  }

  const params = await searchParams
  const activity = params.activityId ? resolveActivityByIdValidated(params.activityId) : null
  const chapter = params.chapterId ? await resolveChapter(params.chapterId) : null
  const validActivity = activity && (!params.moduleId || activity.module.id === params.moduleId) ? activity : null
  const validChapter = chapter && (!params.moduleId || chapter.module.id === params.moduleId) ? chapter : null
  const initialActivityId = validActivity && (!validChapter || validActivity.chapter.id === validChapter.chapter.id)
    ? validActivity.activity.id
    : validChapter?.chapter.activities[0]?.id

  return <VoiceTutorProvider initialActivityId={initialActivityId} />
}
