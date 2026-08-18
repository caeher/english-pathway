import { redirect } from 'next/navigation'
import { getSafeRedirectPath } from '@/lib/auth/safe-redirect'
import { getCurrentUser } from '@/lib/auth/actions'
import { getOnboardingProfile } from '@/lib/onboarding/actions'
import { parseOnboardingLevel } from '@/lib/onboarding/schemas'
import { PageContainer } from '@/components/ui'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { isNativeLanguageCode } from '@/lib/languages/native-languages'

export const metadata = {
  title: 'Welcome to English Pathway',
  description: 'Set up your English learning preferences.',
}

interface OnboardingPageProps {
  searchParams: Promise<{ next?: string; review?: string }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirectTo=%2Fonboarding')

  const profile = await getOnboardingProfile()
  const params = await searchParams
  const review = params.review === '1'

  if (!profile) redirect('/sign-in?redirectTo=%2Fonboarding')
  if (profile.onboarding_completed_at && !review) redirect('/settings')

  const requestedDestination = getSafeRedirectPath(params.next ?? null, '/learn')
  const destination = review || requestedDestination === '/onboarding'
    ? '/settings'
    : requestedDestination

  const initialLevel = parseOnboardingLevel(profile.level)
  const initialPreferredMode = (profile.preferred_mode === 'text' || profile.preferred_mode === 'voice') ? profile.preferred_mode : null
  const initialNativeLanguage =
    profile.native_language && isNativeLanguageCode(profile.native_language) ? profile.native_language : null

  return (
    <main className="min-h-screen bg-(--bg-primary) py-10">
      <PageContainer padding="page">
        <OnboardingWizard
        initialLevel={initialLevel}
        initialDailyGoalMinutes={profile.daily_goal_minutes}
        initialPreferredMode={initialPreferredMode}
        initialNativeLanguage={initialNativeLanguage}
        initialStep={profile.onboarding_step ?? 0}
        destination={destination}
        reviewing={review}
        />
      </PageContainer>
    </main>
  )
}
