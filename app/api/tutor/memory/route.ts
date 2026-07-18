import { NextResponse } from 'next/server'
import { tutorMemoryDeleteSchema, tutorMemoryWriteSchema } from '@/lib/api/tutor-memory-schemas'
import { createClient } from '@/lib/supabase/server'
import { deletePrivateTutorData, deletePrivateTutorMemory, getPrivateTutorExport, savePrivateTutorMemory } from '@/lib/dal/tutor-memory'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  try {
    return NextResponse.json(await getPrivateTutorExport(supabase, user.id))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to export private tutor data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = tutorMemoryWriteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid private tutor memory payload' }, { status: 400 })
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  try {
    const data = await savePrivateTutorMemory(supabase, user.id, parsed.data)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to save private tutor data' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const parsed = tutorMemoryDeleteSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid deletion request' }, { status: 400 })
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  try {
    if (parsed.data.memoryKey) await deletePrivateTutorMemory(supabase, user.id, parsed.data.memoryKey)
    else await deletePrivateTutorData(supabase, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to delete private tutor data' }, { status: 500 })
  }
}
