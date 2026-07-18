import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dal/dashboard'
import LearnerDashboard from '@/components/dashboard/LearnerDashboard'

export const metadata = {
  title: 'Dashboard — English Pathway',
  description: 'Track your English learning progress, streak, and daily goal.',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const data = await getDashboardData(await createClient(), user.id)
  return <LearnerDashboard data={data} />
}
