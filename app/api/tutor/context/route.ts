import { NextResponse } from 'next/server'
import { z } from 'zod'
import { matchKnowledge } from '@/lib/dal/knowledge'

const bodySchema = z.object({
  query: z.string().min(1),
  moduleId: z.string().optional(),
  chapterId: z.string().optional(),
  matchCount: z.number().int().min(1).max(20).optional(),
})

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json())
    const filter: Record<string, unknown> = {}
    if (body.moduleId) filter.moduleId = body.moduleId
    if (body.chapterId) filter.chapterId = body.chapterId

    const matches = await matchKnowledge(body.query, {
      matchCount: body.matchCount ?? 5,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    })

    return NextResponse.json({ matches })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    const status = message.includes('OPENAI') ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
