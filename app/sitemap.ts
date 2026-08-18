import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/auth/app-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl()

  return [
    '',
    '/sign-in',
    '/sign-up',
    '/how-it-works',
    '/faq',
    '/legal/terms',
    '/legal/privacy',
    '/legal/cookies',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))
}
