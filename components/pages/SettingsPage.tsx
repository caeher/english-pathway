'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Database, Download, LogOut, Settings, ShieldCheck, Sparkles, Trash2, Volume2, Type, Palette, Sun, Moon } from 'lucide-react'
import { Button, InlineError, SuccessState, Surface } from '@/components/ui'
import { Label } from '@/components/ui/label'
import { signOutAction, updateSettingsAction } from '@/lib/auth/actions'
import type { SettingsFormValues } from '@/lib/auth/schemas'
import type { Database as DatabaseTypes } from '@/lib/supabase/database.types'
import { clearCookieConsent } from '@/lib/consent/client'
import useThemeStore, { selectDark, selectToggleTheme } from '@/stores/useThemeStore'

type Profile = DatabaseTypes['public']['Tables']['profiles']['Row']

interface SettingsPageProps {
  profile: Profile
  email?: string | null
}

export default function SettingsPage({ profile, email }: SettingsPageProps) {
  const dark = useThemeStore(selectDark)
  const toggleTheme = useThemeStore(selectToggleTheme)

  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<5 | 10 | 20>(
    profile.daily_goal_minutes === 5 || profile.daily_goal_minutes === 10 || profile.daily_goal_minutes === 20
      ? profile.daily_goal_minutes
      : 10,
  )
  const [preferredMode, setPreferredMode] = useState<'voice' | 'text'>(profile.preferred_mode ?? 'text')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const [dataPending, setDataPending] = useState(false)
  const [dataMessage, setDataMessage] = useState<string | null>(null)

  const initialValues = useMemo(() => ({
    fullName: profile.full_name ?? '',
    dailyGoalMinutes: profile.daily_goal_minutes === 5 || profile.daily_goal_minutes === 10 || profile.daily_goal_minutes === 20 ? profile.daily_goal_minutes : 10,
    preferredMode: profile.preferred_mode ?? 'text',
  }), [profile])
  const dirty = fullName !== initialValues.fullName || dailyGoalMinutes !== initialValues.dailyGoalMinutes || preferredMode !== initialValues.preferredMode

  const handleSave = async () => {
    setPending(true)
    setError(null)
    setSuccess(false)

    const data: SettingsFormValues = { fullName: fullName.trim(), dailyGoalMinutes, preferredMode }
    const result = await updateSettingsAction(data)
    setPending(false)
    if (result.error) setError(result.error)
    else setSuccess(true)
  }

  const exportTutorData = async () => {
    setDataPending(true)
    setDataMessage(null)
    try {
      const response = await fetch('/api/tutor/memory')
      if (!response.ok) throw new Error('Could not export private tutor data.')
      const blob = new Blob([JSON.stringify(await response.json(), null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'english-pathway-tutor-data.json'
      anchor.click()
      URL.revokeObjectURL(url)
      setDataMessage('Private tutor data exported.')
    } catch (exportError) {
      setDataMessage(exportError instanceof Error ? exportError.message : 'Could not export private tutor data.')
    } finally {
      setDataPending(false)
    }
  }

  const deleteTutorData = async () => {
    if (!window.confirm('Delete your private tutor summaries and memory notes? This cannot be undone.')) return
    setDataPending(true)
    setDataMessage(null)
    try {
      const response = await fetch('/api/tutor/memory', { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete private tutor data.')
      setDataMessage('Private tutor data deleted.')
    } catch (deleteError) {
      setDataMessage(deleteError instanceof Error ? deleteError.message : 'Could not delete private tutor data.')
    } finally {
      setDataPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-black text-(--text-primary)"><Settings className="h-6 w-6" aria-hidden="true" /> Settings</h1>
        <p className="mt-1 text-(--text-secondary)">Manage your profile, learning preferences, appearance, and account controls.</p>
      </div>

      {error && <InlineError message={error} onRetry={() => void handleSave()} />}
      {success && <SuccessState title="Settings saved" description="Your preferences will be used in your next learning session." />}
      {dirty && <p role="status" className="text-sm text-(--text-muted)">You have unsaved changes.</p>}

      <Surface as="section" padding="lg" className="space-y-5" aria-labelledby="profile-heading">
        <div>
          <h2 id="profile-heading" className="font-display font-bold text-(--text-primary)">Profile</h2>
          <p className="mt-1 text-sm text-(--text-secondary)">This information identifies your learning account.</p>
        </div>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="mt-1 w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-2.5 text-sm text-(--text-primary)" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <input id="email" value={email ?? 'Unavailable'} readOnly aria-describedby="email-help" className="mt-1 w-full rounded-xl border border-(--border-primary) bg-(--bg-secondary) px-4 py-2.5 text-sm text-(--text-muted)" />
          <p id="email-help" className="mt-1 text-xs text-(--text-muted)">Email is managed by your authentication provider.</p>
        </div>
      </Surface>

      {/* Appearance Section */}
      <Surface as="section" padding="lg" className="space-y-5" aria-labelledby="appearance-heading">
        <div>
          <h2 id="appearance-heading" className="flex items-center gap-2 font-display font-bold text-(--text-primary)">
            <Palette className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Appearance & Theme
          </h2>
          <p className="mt-1 text-sm text-(--text-secondary)">Customize the application display mode and theme experience.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => { if (dark) toggleTheme() }}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
              !dark ? 'border-(--accent) bg-(--accent-soft) shadow-sm' : 'border-(--border-primary) hover:bg-(--bg-secondary)'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-(--text-primary)">Light Mode</span>
              <span className="mt-0.5 block text-xs text-(--text-secondary)">Bright and clean visual theme</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { if (!dark) toggleTheme() }}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
              dark ? 'border-(--accent) bg-(--accent-soft) shadow-sm' : 'border-(--border-primary) hover:bg-(--bg-secondary)'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-amber-400">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-(--text-primary)">Dark Mode</span>
              <span className="mt-0.5 block text-xs text-(--text-secondary)">Sleek, low-light theme</span>
            </div>
          </button>
        </div>
      </Surface>

      <Surface as="section" padding="lg" className="space-y-5" aria-labelledby="learning-heading">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="learning-heading" className="flex items-center gap-2 font-display font-bold text-(--text-primary)"><Sparkles className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Learning preferences</h2>
            <p className="mt-1 text-sm text-(--text-secondary)">These values personalize your next session without changing your progress history.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/onboarding?review=1">Recalibrate level</Link></Button>
        </div>
        <div className="rounded-xl bg-(--bg-secondary)/50 p-4">
          <p className="text-sm text-(--text-muted)">Current English level</p>
          <p className="mt-1 font-bold capitalize text-(--text-primary)">{profile.level ?? 'Not set'}</p>
          <p className="mt-1 text-xs text-(--text-muted)">Level is set through onboarding so the tutor can keep an assessment history.</p>
        </div>
        <div>
          <Label htmlFor="dailyGoalMinutes">Daily practice goal</Label>
          <select id="dailyGoalMinutes" value={dailyGoalMinutes} onChange={(event) => setDailyGoalMinutes(Number(event.target.value) as 5 | 10 | 20)} className="mt-1 w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-2.5 text-sm text-(--text-primary)">
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="20">20 minutes</option>
          </select>
        </div>
      </Surface>

      <Surface as="section" padding="lg" className="space-y-5" aria-labelledby="voice-heading">
        <div>
          <h2 id="voice-heading" className="flex items-center gap-2 font-display font-bold text-(--text-primary)"><Volume2 className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Voice and accessibility</h2>
          <p className="mt-1 text-sm text-(--text-secondary)">Choose the mode your tutor should prioritize. You can still switch modes in a lesson.</p>
        </div>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Preferred practice mode</legend>
          {([
            ['voice', 'Voice first', 'Start with speaking practice when available.', Volume2],
            ['text', 'Text first', 'Start quietly with text and on-screen guidance.', Type],
          ] as const).map(([value, title, description, Icon]) => (
            <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${preferredMode === value ? 'border-(--accent) bg-(--accent-soft)' : 'border-(--border-primary)'}`}>
              <input type="radio" name="preferredMode" value={value} checked={preferredMode === value} onChange={() => setPreferredMode(value)} className="mt-1 accent-(--accent)" />
              <span><span className="flex items-center gap-2 font-bold text-(--text-primary)"><Icon className="h-4 w-4 text-(--accent)" aria-hidden="true" /> {title}</span><span className="mt-1 block text-sm text-(--text-secondary)">{description}</span></span>
            </label>
          ))}
        </fieldset>
        <p className="text-xs text-(--text-muted)">Reduced motion follows your device&apos;s accessibility preference.</p>
      </Surface>

      <Surface as="section" padding="lg" className="space-y-4" aria-labelledby="security-heading">
        <h2 id="security-heading" className="flex items-center gap-2 font-display font-bold text-(--text-primary)"><ShieldCheck className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Security</h2>
        <p className="text-sm text-(--text-secondary)">Use the provider-managed recovery flow to change your password.</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link href="/forgot-password">Reset password</Link></Button>
          <form action={signOutAction}><Button type="submit" variant="outline"><LogOut className="h-4 w-4" aria-hidden="true" /> Sign out</Button></form>
        </div>
      </Surface>

      <Surface as="section" padding="lg" className="space-y-4" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="flex items-center gap-2 font-display font-bold text-(--text-primary)"><Database className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Privacy and data</h2>
        <p className="text-sm leading-relaxed text-(--text-secondary)">English Pathway uses your profile preferences and learning activity to personalize sessions and show progress. Audio and full transcripts are not stored as tutor memory.</p>
        <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => void exportTutorData()} disabled={dataPending}><Download className="h-4 w-4" aria-hidden="true" /> Export tutor data</Button><Button type="button" variant="outline" onClick={() => void deleteTutorData()} disabled={dataPending}><Trash2 className="h-4 w-4" aria-hidden="true" /> Delete tutor memory</Button><Button type="button" variant="ghost" onClick={clearCookieConsent}>Change analytics choice</Button></div>
        {dataMessage && <p role="status" className="text-sm text-(--text-secondary)">{dataMessage}</p>}
        <div className="flex flex-wrap gap-4 text-sm font-bold text-(--accent)"><Link href="/legal/privacy">Privacy policy</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/cookies">Cookies</Link></div>
      </Surface>

      <Button onClick={handleSave} loading={pending} loadingLabel="Saving..." disabled={!dirty} className="font-display font-bold">Save changes</Button>
    </div>
  )
}

