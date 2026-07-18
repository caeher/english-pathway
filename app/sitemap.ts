import type { MetadataRoute } from 'next'



export default function sitemap(): MetadataRoute.Sitemap {

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'



  return [

    '',

    '/login',

    '/register',

    '/how-it-works',
    '/curriculum',

    '/learn',

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


