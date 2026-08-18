import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch (err) {
    console.error('[clerk-webhook] Webhook signature verification failed:', err)
    return new NextResponse('Webhook verification failed', { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (evt.type) {
      case 'user.created': {
        const { id, first_name, last_name, image_url, username } = evt.data
        const fullName = [first_name, last_name].filter(Boolean).join(' ') || username || null

        const { error } = await supabase.from('profiles').upsert(
          {
            id,
            full_name: fullName,
            avatar_url: image_url ?? null,
            username: username ?? null,
            onboarding_status: 'not_started',
            onboarding_step: 0,
            daily_goal_minutes: 10,
            preferred_mode: 'voice',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

        if (error) {
          console.error('[clerk-webhook] Failed to create profile on user.created:', error)
          return new NextResponse('Database error', { status: 500 })
        }
        break
      }

      case 'user.updated': {
        const { id, first_name, last_name, image_url, username } = evt.data
        const fullName = [first_name, last_name].filter(Boolean).join(' ') || username || null

        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            avatar_url: image_url ?? null,
            username: username ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) {
          console.error('[clerk-webhook] Failed to update profile on user.updated:', error)
          return new NextResponse('Database error', { status: 500 })
        }
        break
      }

      case 'user.deleted': {
        const { id } = evt.data
        if (id) {
          const { error } = await supabase.from('profiles').delete().eq('id', id)
          if (error) {
            console.error('[clerk-webhook] Failed to delete profile on user.deleted:', error)
            return new NextResponse('Database error', { status: 500 })
          }
        }
        break
      }

      default:
        // Ignore unhandled event types with 200 OK
        break
    }

    return new NextResponse('OK', { status: 200 })
  } catch (err) {
    console.error('[clerk-webhook] Internal error handling webhook:', err)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
