import type { SupabaseClient } from '@supabase/supabase-js'
import { auth, currentUser } from '@clerk/nextjs/server'
import type { User as ClerkUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

export type AppSupabaseClient = SupabaseClient<Database>

export interface AuthenticatedContext {
  supabase: AppSupabaseClient
  userId: string
  user?: ClerkUser | null
}

export async function getAuthenticatedContext(): Promise<AuthenticatedContext | null> {
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createAdminClient()
  return { supabase, userId }
}
