import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Reset password — English Pathway',
}

export default async function ForgotPasswordPage() {
  redirect('/sign-in')
}
