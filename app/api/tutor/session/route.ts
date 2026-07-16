import { NextResponse } from 'next/server'

export async function GET() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!agentId && !apiKey) {
    return NextResponse.json({
      textOnly: true,
      configured: false,
      message: 'ElevenLabs not configured. Text mode available when agent ID is set.',
    })
  }

  if (agentId) {
    return NextResponse.json({
      agentId,
      textOnly: false,
      configured: true,
    })
  }

  if (apiKey && agentId) {
    const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url')
    url.searchParams.set('agent_id', agentId)

    const res = await fetch(url.toString(), {
      headers: { 'xi-api-key': apiKey },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const data = (await res.json()) as { signed_url: string }
    return NextResponse.json({
      signedUrl: data.signed_url,
      textOnly: false,
      configured: true,
    })
  }

  return NextResponse.json({ textOnly: true, configured: false })
}
