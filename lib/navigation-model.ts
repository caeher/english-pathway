import type { NavigationContext } from '@/lib/navigation'

export type HeaderNavItem = {
  href: string
  label: string
  icon: 'book' | 'learn' | 'review' | 'dashboard'
}

type HeaderNavDefinition = HeaderNavItem & {
  visible: (context: NavigationContext) => boolean
}

const headerNavDefinitions: HeaderNavDefinition[] = [
  { href: '/curriculum', label: 'Curriculum', icon: 'book', visible: () => true },
  { href: '/learn', label: 'Learn', icon: 'learn', visible: (context) => !context.isAuthenticated || context.onboardingCompleted },
  { href: '/onboarding?next=%2Flearn', label: 'Continue setup', icon: 'learn', visible: (context) => context.isAuthenticated && !context.onboardingCompleted },
  { href: '/review', label: 'Review', icon: 'review', visible: (context) => context.isAuthenticated && context.onboardingCompleted },
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', visible: (context) => context.isAuthenticated && context.onboardingCompleted },
]

export function getHeaderNavItems(context: NavigationContext): HeaderNavItem[] {
  return headerNavDefinitions.filter((item) => item.visible(context)).map(({ visible: _, ...item }) => item)
}

export function isNavigationItemActive(pathname: string, href: string): boolean {
  const path = href.split('?')[0]
  return pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))
}
