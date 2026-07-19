import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export type AppSupabaseClient = SupabaseClient<Database>

export interface AuthenticatedContext {
  supabase: AppSupabaseClient
  user: User
  userId: string
}

export async function getAuthenticatedContext(): Promise<AuthenticatedContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? { supabase, user, userId: user.id } : null
}
