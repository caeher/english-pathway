import type { SupabaseClient } from '@supabase/supabase-js'
import { onboardingLevelSchema, type OnboardingLevel } from '@/lib/onboarding/schemas'
import type { Database } from '@/lib/supabase/database.types'

export type EnglishAssistantLearnerContext = {
  level: OnboardingLevel | null
}

export async function resolveEnglishAssistantLearnerContext(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<EnglishAssistantLearnerContext> {
  const { data, error } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data?.level) {
    return { level: null }
  }

  const parsed = onboardingLevelSchema.safeParse(data.level)
  return { level: parsed.success ? parsed.data : null }
}
