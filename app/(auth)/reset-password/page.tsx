import Link from 'next/link'
import { ResetPasswordForm } from '../_components/reset-password-form'
import { getCurrentUser } from '@/lib/auth/actions'
import { getExplicitRedirectParam } from '@/lib/auth/resolve-redirect'

export const metadata = {
  title: 'New password — English Pathway',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ redirectTo?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const user = await getCurrentUser()
  const params = await searchParams
  const redirectTo = getExplicitRedirectParam(params.redirectTo)

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-black text-2xl text-(--text-primary)">Invalid link</h1>
          <p className="text-sm text-(--text-secondary) mt-1">The password reset link expired or is not valid.</p>
        </div>
        <Link href="/forgot-password" className="inline-flex items-center justify-center rounded-xl bg-(--accent) px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
          Request a new link
        </Link>
      </div>
    )
  }

  return <ResetPasswordForm redirectTo={redirectTo} />
}
