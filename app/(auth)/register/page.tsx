import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Create account — English Pathway',
}

interface RegisterPageProps {
  searchParams?: Promise<{ redirectTo?: string }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams
  const query = params?.redirectTo ? `?redirectTo=${encodeURIComponent(params.redirectTo)}` : ''
  redirect(`/sign-up${query}`)
}
