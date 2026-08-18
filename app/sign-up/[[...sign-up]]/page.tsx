import { SignUp } from '@clerk/nextjs'

export const metadata = {
  title: 'Sign Up — English Pathway',
  description: 'Create your English Pathway account to start guided English practice.',
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--bg-page) px-4 py-12">
      <div className="w-full max-w-md">
        <SignUp
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
