import type { NavigationContext } from '@/lib/navigation'

export type HeaderNavItem = {
  href: string
  label: string
  icon: 'book' | 'learn' | 'review' | 'dashboard'
}

export function getHeaderNavItems(context: NavigationContext): HeaderNavItem[] {
  if (!context.isAuthenticated) {
    return [
      { href: '/curriculum', label: 'Curriculum', icon: 'book' },
      { href: '/learn', label: 'Learn', icon: 'learn' },
    ]
  }

  if (!context.onboardingCompleted) {
    return [
      { href: '/curriculum', label: 'Curriculum', icon: 'book' },
      { href: '/onboarding?next=%2Flearn', label: 'Continue setup', icon: 'learn' },
    ]
  }

  return [
    { href: '/curriculum', label: 'Curriculum', icon: 'book' },
    { href: '/learn', label: 'Learn', icon: 'learn' },
    { href: '/review', label: 'Review', icon: 'review' },
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  ]
}
