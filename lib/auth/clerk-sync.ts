import { currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']

export async function ensureUserProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createAdminClient()

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (fetchError) {
    console.error('[clerk-sync] Error querying profile:', fetchError)
  }

  if (existing) {
    return existing
  }

  let user = null
  try {
    user = await currentUser()
  } catch (err) {
    console.warn('[clerk-sync] Unable to fetch currentUser:', err)
  }

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || null
    : null
  const avatarUrl = user?.imageUrl || null

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        onboarding_status: 'pending',
        onboarding_step: 0,
        daily_goal_minutes: 10,
        preferred_mode: 'voice',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (insertError) {
    console.error('[clerk-sync] Failed to insert initial profile:', insertError)
    return null
  }

  return created
}
