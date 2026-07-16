import { redirect } from 'next/navigation'
import SettingsPage from '@/components/pages/SettingsPage'
import { getCurrentProfile } from '@/lib/auth/actions'

export const metadata = {
  title: 'Settings — English Pathway',
}

export default async function SettingsRoutePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  return <SettingsPage profile={profile} />
}
