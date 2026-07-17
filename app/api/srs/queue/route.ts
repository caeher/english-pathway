import { NextResponse } from 'next/server'
import { getDueQueue } from '@/lib/dal/srs'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  try {
    return NextResponse.json({ items: await getDueQueue(supabase, user.id) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to load review queue' }, { status: 500 })
  }
}
