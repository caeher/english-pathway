'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FriendlyErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
}

export default function FriendlyError({ error, reset, title = 'Something went wrong' }: FriendlyErrorProps) {
  useEffect(() => {
    console.error('Captured Error:', error)
  }, [error])

  const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('401')
  const isNetwork = error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('429')

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-16 px-6 bg-(--bg-card) border border-(--border-primary) rounded-2xl shadow-sm mt-8">
      <div className="space-y-2">
        <h2 className="font-display font-black text-2xl text-(--text-primary)">
          {isUnauthorized ? 'Session expired' : isNetwork ? 'Connection error' : title}
        </h2>
        <p className="text-sm text-(--text-secondary) leading-relaxed">
          {isUnauthorized
            ? 'Your session expired or you do not have permission to access this section. Please sign in again.'
            : isNetwork
              ? 'We could not connect to the server. Check your internet connection or try again in a few moments.'
              : error.message || 'An unexpected error occurred while processing the request.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isUnauthorized ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">Sign in</Link>
          </Button>
        ) : (
          <>
            <Button onClick={reset} className="w-full sm:w-auto">
              Try again
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href="mailto:soporte@english-pathway.com?subject=Error report">
                Contact support
              </a>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
