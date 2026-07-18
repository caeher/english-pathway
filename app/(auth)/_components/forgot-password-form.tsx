'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { TextField, useForm } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { forgotPasswordSchema } from '@/lib/auth/schemas'
import { forgotPasswordAction, type AuthActionState } from '@/lib/auth/actions'
import { appendRedirectTo, getExplicitRedirectParam } from '@/lib/auth/resolve-redirect'
import { useSearchParams } from 'next/navigation'

const initialState: AuthActionState = {}

export function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const explicitRedirectTo = getExplicitRedirectParam(searchParams.get('redirectTo'))
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState)
  const { values, errors, handleChange, reset: resetForm } = useForm({
    initialValues: { email: '' },
    schema: forgotPasswordSchema,
  })

  useEffect(() => {
    if (state.status === 'success') resetForm()
  }, [resetForm, state.status])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl text-(--text-primary)">Reset password</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">We&apos;ll send you a link to reset your password.</p>
      </div>

      {state.error && <div role="alert" aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{state.error}</div>}
      {state.success && <div role="status" aria-live="polite" className="rounded-xl border border-(--success)/30 bg-(--success-soft) px-4 py-3 text-sm text-(--success)">{state.success}</div>}

      <form action={formAction} className="space-y-4">
        {explicitRedirectTo && <input type="hidden" name="redirectTo" value={explicitRedirectTo} />}
        <TextField name="email" label="Email" type="email" autoComplete="email" icon={Mail} value={values.email} onChange={handleChange} error={errors.email} required />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <Link href={appendRedirectTo('/login', explicitRedirectTo)} className="block text-center text-sm text-(--accent) hover:underline">
        ← Back to sign in
      </Link>
    </div>
  )
}
