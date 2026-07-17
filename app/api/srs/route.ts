import { NextResponse } from 'next/server'
import { srsRequestSchema } from '@/lib/api/srs-schemas'
import { enqueueReviewItems, reviewSrsItem } from '@/lib/dal/srs'
import { findReviewItem } from '@/lib/srs/content'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const payload = srsRequestSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return NextResponse.json({ error: 'Invalid SRS request' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    if (payload.data.action === 'enqueue') {
      const items = payload.data.contentRefs.map(findReviewItem).filter((item): item is NonNullable<typeof item> => item !== null)
      if (items.length !== payload.data.contentRefs.length) {
        return NextResponse.json({ error: 'One or more review items were not found' }, { status: 404 })
      }
      await enqueueReviewItems(supabase, user.id, items)
      return NextResponse.json({ ok: true, enqueued: items.length })
    }

    const item = await reviewSrsItem(supabase, user.id, payload.data.itemId, payload.data.quality)
    if (!item) return NextResponse.json({ error: 'Review item not found' }, { status: 404 })
    return NextResponse.json({ ok: true, item })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to update review queue' }, { status: 500 })
  }
}
