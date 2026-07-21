import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { getUsageCredits } from '@/lib/credits/usage'

export async function GET() {
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to view your credits.'), 'Authentication required')
  return respondWithApiErrors(() => getUsageCredits(context.supabase), 'Unable to load your credits.')
}
