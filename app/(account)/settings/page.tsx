import { redirect } from 'next/navigation'
import SettingsPage from '@/components/pages/SettingsPage'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/actions'
import { getMissingLegalConsents } from '@/lib/auth/required-consent'

export const metadata = {
  title: 'Settings — English Pathway',
}

interface SettingsRoutePageProps {
  searchParams: Promise<{ reconsent?: string }>
}

export default async function SettingsRoutePage({ searchParams }: SettingsRoutePageProps) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/sign-in')

  const user = await getCurrentUser()
  const params = await searchParams
  const missingLegalConsents = user ? await getMissingLegalConsents(user.id) : []

  return (
    <SettingsPage
      profile={profile}
      email={user?.email}
      missingLegalConsents={missingLegalConsents}
      showReconsentPrompt={params.reconsent === '1' || missingLegalConsents.length > 0}
    />
  )
}
