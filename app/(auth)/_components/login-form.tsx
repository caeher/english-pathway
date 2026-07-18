'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { TextField, PasswordField, useForm } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { loginSchema } from '@/lib/auth/schemas'
import { signInAction, type AuthActionState } from '@/lib/auth/actions'
import { appendRedirectTo, getExplicitRedirectParam } from '@/lib/auth/resolve-redirect'
import { OAuthButtons } from './oauth-buttons'
import { useSearchParams } from 'next/navigation'

const initialState: AuthActionState = {}

const URL_ERROR_MESSAGES: Record<string, string> = {
  auth_callback_error: 'Authentication could not be completed. Please try again.',
  confirmation_error: 'The confirmation link expired or is invalid.',
  oauth_start_error: 'Could not start sign-in with that provider. Please try again.',
}

function getUrlErrorMessage(errorParam: string | null): string | undefined {
  if (!errorParam) return undefined
  if (URL_ERROR_MESSAGES[errorParam]) return URL_ERROR_MESSAGES[errorParam]
  try {
    return decodeURIComponent(errorParam)
  } catch {
    return URL_ERROR_MESSAGES.auth_callback_error
  }
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const explicitRedirectTo = getExplicitRedirectParam(searchParams.get('redirectTo'))
  const urlError = getUrlErrorMessage(searchParams.get('error'))
  const [state, formAction, pending] = useActionState(signInAction, initialState)

  const { values, errors, handleChange } = useForm({
    initialValues: { email: '', password: '' },
    schema: loginSchema,
  })

  const displayError = state.error ?? urlError

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl text-(--text-primary)">Sign in</h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          Don&apos;t have an account?{' '}
          <Link
            href={appendRedirectTo('/register', explicitRedirectTo)}
            className="text-(--accent) hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>

      {displayError && (
        <div role="alert" aria-live="polite" className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {displayError}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {explicitRedirectTo && (
          <input type="hidden" name="redirectTo" value={explicitRedirectTo} />
        )}

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
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <div className="flex justify-end">
          <Link
            href={appendRedirectTo('/forgot-password', explicitRedirectTo)}
            className="text-sm text-(--accent) hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <OAuthButtons redirectTo={explicitRedirectTo} />
    </div>
  )
}
