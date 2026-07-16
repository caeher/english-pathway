import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event_name, properties, session_id } = body

    if (!event_name || typeof event_name !== 'string') {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('analytics_events').insert({
      user_id: user?.id ?? null,
      session_id: session_id ?? null,
      event_name,
      properties: properties ?? {},
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
