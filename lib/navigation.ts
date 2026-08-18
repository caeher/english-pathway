import type { NavItem } from '@/components/layouts'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface NavigationContext {
  isAuthenticated: boolean
  onboardingCompleted: boolean
  email: string | null
  fullName: string | null
  avatarUrl: string | null
}

export async function getNavigationContext(): Promise<NavigationContext> {
  const { userId } = await auth()

  if (!userId) {
    return { isAuthenticated: false, onboardingCompleted: false, email: null, fullName: null, avatarUrl: null }
  }

  let user = null
  try {
    user = await currentUser()
  } catch (err) {
    console.warn('[navigation] unable to get currentUser:', err)
  }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle()

  const email = user?.emailAddresses[0]?.emailAddress ?? null
  const fullName = profile?.full_name ?? (user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username : null)
  const avatarUrl = profile?.avatar_url ?? user?.imageUrl ?? null

  return {
    isAuthenticated: true,
    onboardingCompleted: Boolean(profile?.onboarding_completed_at),
    email,
    fullName,
    avatarUrl,
  }
}

type AccountNavDefinition = NavItem & {
  visible: (context: NavigationContext) => boolean
}

const accountNavDefinitions: AccountNavDefinition[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', visible: (context) => context.onboardingCompleted },
  { label: 'Learn', href: '/learn', icon: 'GraduationCap', visible: (context) => context.onboardingCompleted },
  { label: 'Chats', href: '/chats', icon: 'MessageCircle', visible: () => true },
  { label: 'Curriculum', href: '/curriculum', icon: 'BookOpen', visible: () => true },
  { label: 'Continue setup', href: '/onboarding?next=%2Flearn', icon: 'GraduationCap', visible: (context) => !context.onboardingCompleted },
  { label: 'Review', href: '/review', icon: 'RotateCcw', visible: (context) => context.onboardingCompleted, badge: 'srs' },
]

export function getAccountNavItems(context: NavigationContext): NavItem[] {
  return accountNavDefinitions
    .filter((item) => item.visible(context))
    .map(({ visible: _, ...item }) => item)
}
