import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Sign in — English Pathway',
}

interface LoginPageProps {
  searchParams?: Promise<{ redirectTo?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const query = params?.redirectTo ? `?redirectTo=${encodeURIComponent(params.redirectTo)}` : ''
  redirect(`/sign-in${query}`)
}
