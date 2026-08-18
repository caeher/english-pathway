import { SignIn } from '@clerk/nextjs'

export const metadata = {
  title: 'Sign In — English Pathway',
  description: 'Sign in to your English Pathway account to continue learning.',
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--bg-page) px-4 py-12">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full',
              card: 'shadow-lg border border-(--border-primary) rounded-2xl bg-(--bg-card)',
            },
          }}
        />
      </div>
    </div>
  )
}
