import { Suspense } from 'react'
import { LoginForm } from '../_components/login-form'

export const metadata = {
  title: 'Sign in — English Pathway',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-(--text-muted)">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
