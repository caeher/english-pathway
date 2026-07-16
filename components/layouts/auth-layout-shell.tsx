'use client'

import { usePathname } from 'next/navigation'
import { AuthLayout } from '@/components/layouts/auth-layout'

const AUTH_COPY: Record<string, { title: string; description: string }> = {
  '/login': {
    title: 'Welcome back',
    description:
      'Pick up where you left off and keep practicing English with interactive games.',
  },
  '/register': {
    title: 'Start learning English today',
    description:
      'Create your free account and access interactive games designed to build vocabulary and grammar skills.',
  },
  '/forgot-password': {
    title: 'Recover your access',
    description:
      'We will send you a secure link to reset your password and get back to learning.',
  },
  '/reset-password': {
    title: 'New password',
    description:
      'Choose a strong password to protect your progress and your account.',
  },
}

export function AuthLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const copy = AUTH_COPY[pathname] ?? {
    title: 'English Pathway',
    description:
      'Learn English interactively through short, focused browser games.',
  }

  return (
    <AuthLayout title={copy.title} description={copy.description}>
      {children}
    </AuthLayout>
  )
}
