'use client'

import { useActionState } from 'react'
import { PasswordField, useForm } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { resetPasswordSchema } from '@/lib/auth/schemas'
import { resetPasswordAction, type AuthActionState } from '@/lib/auth/actions'

const initialState: AuthActionState = {}

interface ResetPasswordFormProps {
  redirectTo?: string | null
}

export function ResetPasswordForm({ redirectTo }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState)

  const { values, errors, handleChange } = useForm({
    initialValues: { password: '', confirmPassword: '' },
    schema: resetPasswordSchema,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl text-(--text-primary)">New password</h1>
        <p className="text-sm text-(--text-secondary) mt-1">Enter your new password.</p>
      </div>

      {state.error && (
        <div role="alert" aria-live="polite" className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <PasswordField
          name="password"
          label="New password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        <PasswordField
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Saving...' : 'Save password'}
        </Button>
      </form>
    </div>
  )
}
