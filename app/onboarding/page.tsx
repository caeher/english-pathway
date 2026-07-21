import { redirect } from 'next/navigation'
import { getSafeRedirectPath } from '@/lib/auth/safe-redirect'
import { getCurrentUser } from '@/lib/auth/actions'
import { getOnboardingProfile } from '@/lib/onboarding/actions'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export const metadata = {
  title: 'Welcome to English Pathway',
  description: 'Set up your English learning preferences.',
}

interface OnboardingPageProps {
  searchParams: Promise<{ next?: string; review?: string }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirectTo=%2Fonboarding')

  const profile = await getOnboardingProfile()
  const params = await searchParams
  const review = params.review === '1'

  if (!profile) redirect('/login?redirectTo=%2Fonboarding')
  if (profile.onboarding_completed_at && !review) redirect('/settings')

  const requestedDestination = getSafeRedirectPath(params.next ?? null, '/learn')
  const destination = review || requestedDestination === '/onboarding'
    ? '/settings'
    : requestedDestination

  const initialLevel = (profile.level === 'beginner' || profile.level === 'intermediate' || profile.level === 'advanced') ? profile.level : null

  return (
    <main className="min-h-screen bg-(--bg-primary) px-4 py-10 sm:px-6">
      <OnboardingWizard
        initialLevel={initialLevel}
        initialDailyGoalMinutes={profile.daily_goal_minutes}
        initialPreferredMode={profile.preferred_mode}
        initialStep={profile.onboarding_step ?? 0}
        destination={destination}
        reviewing={review}
      />
    </main>
  )
}
