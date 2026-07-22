import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts'
import { getAccountNavItems, getNavigationContext } from '@/lib/navigation'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/actions'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profile, navigation] = await Promise.all([getCurrentProfile(), getNavigationContext()])

  return (
    <DashboardLayout
      navItems={getAccountNavItems(navigation)}
      title="Account"
      email={user.email}
      fullName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
    >
      {children}
    </DashboardLayout>
  )
}
