import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyticsEventSchema } from '@/lib/api/analytics-schemas'

export async function POST(request: Request) {
  try {
    const body = analyticsEventSchema.safeParse(await request.json().catch(() => null))
    if (!body.success) return NextResponse.json({ error: 'Invalid event' }, { status: 400 })

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('analytics_events').insert({
      user_id: user?.id ?? null,
      session_id: body.data.session_id ?? null,
      event_name: body.data.event_name,
      properties: body.data.properties,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
