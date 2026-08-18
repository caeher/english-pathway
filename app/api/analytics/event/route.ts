import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyticsEventSchema } from '@/lib/api/analytics-schemas'

export async function POST(request: Request) {
  try {
    const body = analyticsEventSchema.safeParse(await request.json().catch(() => null))
    if (!body.success) return NextResponse.json({ error: 'Invalid event' }, { status: 400 })

    const { userId } = await auth()
    const supabase = createAdminClient()

    await supabase.from('analytics_events').insert({
      user_id: userId ?? null,
      session_id: body.data.session_id ?? null,
      event_name: body.data.event_name,
      properties: body.data.properties,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
