import { NextResponse } from 'next/server'
import { z } from 'zod'
import { curriculumContextActionSchema } from '@/lib/tutor/schemas'
import { buildTutorContext } from '@/lib/tutor/context'
import { resolveModule, resolveChapter } from '@/lib/content/resolve'
import { createClient } from '@/lib/supabase/server'

const requestSchema = curriculumContextActionSchema.extend({
  matchCount: z.number().int().min(1).max(5).optional(),
})

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid curriculum context request' }, { status: 400 })

  const body = parsed.data
  const resolvedModule = body.moduleId ? await resolveModule(body.moduleId) : null
  if (body.moduleId && !resolvedModule) return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  const chapter = body.chapterId ? await resolveChapter(body.chapterId) : null
  if (body.chapterId && !chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  if (resolvedModule && chapter && chapter.module.id !== resolvedModule.id) {
    return NextResponse.json({ error: 'Chapter does not belong to module' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  try {
    const context = await buildTutorContext(supabase, user?.id ?? null, body)
    const matches = context.retrieval.matches.map((match, index) => ({
      id: `${match.citation.moduleId}:${match.citation.chapterId ?? 'module'}:${index}`,
      content: match.content,
      similarity: match.similarity,
      metadata: match.citation,
    }))
    return NextResponse.json({ matches, context })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Unable to build tutor context' }, { status: 503 })
  }
}
