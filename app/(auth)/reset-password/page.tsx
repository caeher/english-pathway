import { redirect } from 'next/navigation'

export const metadata = {
  title: 'New password — English Pathway',
}

export default async function ResetPasswordPage() {
  redirect('/sign-in')
}
