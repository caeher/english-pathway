import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { isMaintenanceModeActive, UPCOMING_FEATURES } from '@/lib/maintenance/config'
import { proxy } from '@/proxy'

describe('Maintenance Mode System', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-anon-key',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_bW92aW5nLXRlcnJpZXItMjA1Ni5jbGVyay5hY2NvdW50cy5kZXYk',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_FYtiFyySKq2Bhicz2OW5IVqCvKqWkCLEr7dQdEWlEa',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('detects active maintenance mode from NEXT_PUBLIC_MAINTENANCE_MODE', () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'true'
    expect(isMaintenanceModeActive()).toBe(true)

    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'false'
    expect(isMaintenanceModeActive()).toBe(false)
  })

  it('detects active maintenance mode from MAINTENANCE_MODE', () => {
    process.env.MAINTENANCE_MODE = 'true'
    expect(isMaintenanceModeActive()).toBe(true)

    process.env.MAINTENANCE_MODE = 'false'
    expect(isMaintenanceModeActive()).toBe(false)
  })

  it('exports valid upcoming features', () => {
    expect(UPCOMING_FEATURES.length).toBeGreaterThan(0)
    UPCOMING_FEATURES.forEach((feature) => {
      expect(feature).toHaveProperty('id')
      expect(feature).toHaveProperty('title')
      expect(feature).toHaveProperty('description')
      expect(feature).toHaveProperty('icon')
    })
  })

  describe('Proxy Redirection', () => {
    it('redirects user requests to /maintenance when maintenance mode is ACTIVE', async () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'true'

      const req = new NextRequest('http://localhost:3000/learn')
      const res = await proxy(req)

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/maintenance')
    })

    it('does NOT redirect /maintenance when maintenance mode is ACTIVE', async () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'true'

      const req = new NextRequest('http://localhost:3000/maintenance')
      const res = await proxy(req)

      expect(res.headers.get('location')).not.toBe('http://localhost:3000/maintenance')
    })

    it('redirects /maintenance to / when maintenance mode is INACTIVE', async () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = 'false'
      process.env.MAINTENANCE_MODE = 'false'

      const req = new NextRequest('http://localhost:3000/maintenance')
      const res = await proxy(req)

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/')
    })
  })
})
