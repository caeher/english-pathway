'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, User } from 'lucide-react'
import { TextField, PasswordField, CheckboxField, useForm } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { registerSchema } from '@/lib/auth/schemas'
import { signUpAction, type AuthActionState } from '@/lib/auth/actions'
import { appendRedirectTo, getExplicitRedirectParam } from '@/lib/auth/resolve-redirect'
import { OAuthButtons } from './oauth-buttons'
import { useSearchParams } from 'next/navigation'

const initialState: AuthActionState = {}

export function RegisterForm() {
  const searchParams = useSearchParams()
  const explicitRedirectTo = getExplicitRedirectParam(searchParams.get('redirectTo'))
  const referralCode = searchParams.get('ref')
  const [state, formAction, pending] = useActionState(signUpAction, initialState)

  const { values, errors, handleChange, reset: resetForm } = useForm({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    schema: registerSchema,
  })

  useEffect(() => {
    if (state.status === 'needs_email_confirmation') resetForm()
  }, [resetForm, state.status])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl text-(--text-primary)">Create account</h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          Already have an account?{' '}
          <Link
            href={appendRedirectTo('/login', explicitRedirectTo)}
            className="text-(--accent) hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {state.error && (
        <div role="alert" aria-live="polite" className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </div>
      )}

      {state.success && (
        <div role="status" aria-live="polite" className="rounded-xl bg-(--success-soft) border border-(--success)/30 px-4 py-3 text-sm text-(--success)">
          {state.success}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {explicitRedirectTo && (
          <input type="hidden" name="redirectTo" value={explicitRedirectTo} />
        )}
        {referralCode && (
          <input type="hidden" name="referralCode" value={referralCode} />
        )}

        <TextField
          name="fullName"
          label="Full name"
          autoComplete="name"
          icon={User}
          value={values.fullName}
          onChange={handleChange}
          error={errors.fullName}
          required
        />

        <TextField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <PasswordField
          name="password"
          label="Password"
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

        <input type="hidden" name="acceptTerms" value={values.acceptTerms ? 'on' : ''} />

        <CheckboxField
          name="acceptTerms"
          label="I accept the terms and conditions and privacy policy"
          checked={values.acceptTerms}
          onChange={handleChange}
          error={errors.acceptTerms}
        />
        <p className="text-xs text-(--text-muted) -mt-2">
          Read the{' '}
          <Link href="/legal/terms" className="text-(--accent) hover:underline" target="_blank">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="text-(--accent) hover:underline" target="_blank">
            privacy policy
          </Link>
        </p>

        <Button type="submit" className="w-full" disabled={pending || state.status === 'needs_email_confirmation'}>
          {pending ? 'Creating account...' : state.status === 'needs_email_confirmation' ? 'Check your email' : 'Create account'}
        </Button>
      </form>

      <OAuthButtons redirectTo={explicitRedirectTo} />
    </div>
  )
}
