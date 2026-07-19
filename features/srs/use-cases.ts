import type { AuthenticatedContext } from '@/lib/api/context'
import { DomainError } from '@/lib/api/errors'
import { enqueueReviewItems, getDueCount, getDueQueue, reviewSrsItem } from '@/lib/dal/srs'
import { findReviewItem } from '@/lib/srs/content'
import type { SrsRequest } from './contracts'

export async function updateReviewQueueUseCase(context: AuthenticatedContext, input: SrsRequest) {
  if (input.action === 'enqueue') {
    const items = input.contentRefs.map(findReviewItem).filter((item): item is NonNullable<typeof item> => item !== null)
    if (items.length !== input.contentRefs.length) {
      throw new DomainError('NOT_FOUND', 'One or more review items were not found')
    }
    await enqueueReviewItems(context.supabase, context.userId, items)
    return { ok: true as const, enqueued: items.length }
  }

  const item = await reviewSrsItem(context.supabase, context.userId, input.itemId, input.quality)
  if (!item) throw new DomainError('NOT_FOUND', 'Review item not found')
  return { ok: true as const, item }
}

export function getReviewQueueUseCase(context: AuthenticatedContext) {
  return getDueQueue(context.supabase, context.userId)
}

export function getReviewDueCountUseCase(context: AuthenticatedContext) {
  return getDueCount(context.supabase, context.userId)
}
