'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateSettingsAction } from '@/lib/auth/actions'
import type { SettingsFormValues } from '@/lib/auth/schemas'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SettingsPageProps {
  profile: Profile
}

export default function SettingsPage({ profile }: SettingsPageProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)

  const handleSave = async () => {
    setPending(true)
    setError(null)
    setSuccess(false)

    const data: SettingsFormValues = { fullName }
    const result = await updateSettingsAction(data)
    setPending(false)
    if (result.error) setError(result.error)
    else setSuccess(true)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-black text-2xl text-(--text-primary) flex items-center gap-2">
          <Settings className="w-6 h-6" /> Settings
        </h1>
        <p className="text-(--text-secondary) mt-1">Manage your account details.</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-3 rounded-xl">{error}</p>
      )}
      {success && (
        <p className="text-sm text-(--success) bg-(--success-soft) px-4 py-3 rounded-xl">
          Settings saved successfully.
        </p>
      )}

      <section className="rounded-2xl border border-(--border-primary) bg-(--bg-card) p-6 space-y-4">
        <h2 className="font-display font-bold text-(--text-primary)">Profile</h2>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-2.5 text-sm"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-(--border-primary) bg-(--bg-card) p-6 space-y-4">
        <h2 className="font-display font-bold text-(--text-primary)">Password</h2>
        <p className="text-sm text-(--text-secondary)">
          To change your password, use the forgot password flow from the login page.
        </p>
        <Button asChild variant="outline">
          <Link href="/forgot-password">Reset password</Link>
        </Button>
      </section>

      <Button onClick={handleSave} disabled={pending} className="font-display font-bold">
        {pending ? 'Saving...' : 'Save changes'}
      </Button>
    </div>
  )
}
