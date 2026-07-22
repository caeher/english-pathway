import type { NavItem } from '@/components/layouts'
import { createClient } from '@/lib/supabase/server'

export interface NavigationContext {
  isAuthenticated: boolean
  onboardingCompleted: boolean
  email: string | null
  fullName: string | null
  avatarUrl: string | null
}

export async function getNavigationContext(): Promise<NavigationContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isAuthenticated: false, onboardingCompleted: false, email: null, fullName: null, avatarUrl: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  return {
    isAuthenticated: true,
    onboardingCompleted: Boolean(profile?.onboarding_completed_at),
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  }
}

type AccountNavDefinition = NavItem & {
  visible: (context: NavigationContext) => boolean
}

const accountNavDefinitions: AccountNavDefinition[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', visible: (context) => context.onboardingCompleted },
  { label: 'Curriculum', href: '/curriculum', icon: 'BookOpen', visible: () => true },
  { label: 'Learn', href: '/learn', icon: 'GraduationCap', visible: (context) => context.onboardingCompleted },
  { label: 'Continue setup', href: '/onboarding?next=%2Flearn', icon: 'GraduationCap', visible: (context) => !context.onboardingCompleted },
  { label: 'Review', href: '/review', icon: 'RotateCcw', visible: (context) => context.onboardingCompleted, badge: 'srs' },
]

export function getAccountNavItems(context: NavigationContext): NavItem[] {
  return accountNavDefinitions
    .filter((item) => item.visible(context))
    .map(({ visible: _, ...item }) => item)
}
