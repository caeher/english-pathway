'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { signOutAction } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'

type SignOutButtonProps = {
  variant?: 'button' | 'menu-item'
  className?: string
}

export function SignOutButton({ variant = 'button', className }: SignOutButtonProps) {
  const [pending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(() => {
      void signOutAction()
    })
  }

  if (variant === 'menu-item') {
    return (
      <DropdownMenuItem
        className={cn('text-red-500 focus:text-red-500', className)}
        disabled={pending}
        onSelect={(event) => {
          event.preventDefault()
          handleSignOut()
        }}
      >
        <LogOut className="mr-2 h-4 w-4 shrink-0" />
        <span>{pending ? 'Signing out...' : 'Sign out'}</span>
      </DropdownMenuItem>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={pending}
      loading={pending}
      loadingLabel="Signing out..."
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Sign out
    </Button>
  )
}
