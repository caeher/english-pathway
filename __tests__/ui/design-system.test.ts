import { describe, expect, it } from 'vitest'
import { badgeVariants } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { surfaceVariants } from '@/components/ui/surface'

describe('design-system variants', () => {
  it('covers semantic button intent and state-safe sizing', () => {
    expect(buttonVariants({ variant: 'success', size: 'lg' })).toContain('bg-(--success)')
    expect(buttonVariants({ variant: 'warning', size: 'sm' })).toContain('bg-(--reward)')
    expect(buttonVariants({ variant: 'outline', size: 'icon' })).toContain('h-9 w-9')
  })

  it('provides theme-aware surfaces and status badges', () => {
    expect(surfaceVariants({ variant: 'accent', padding: 'lg', elevation: 'raised' })).toContain('bg-(--accent-soft)')
    expect(surfaceVariants({ variant: 'success' })).toContain('border-(--success)/30')
    expect(badgeVariants({ variant: 'success', size: 'md' })).toContain('bg-(--success-soft)')
  })
})
