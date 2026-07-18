import type { NextConfig } from 'next'
import { securityHeaders } from './lib/security/headers'

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    return [
      { source: '/como-funciona', destination: '/how-it-works', permanent: true },
      { source: '/para-profesores', destination: '/', permanent: true },
      { source: '/games', destination: '/learn', permanent: true },
      { source: '/games/:path*', destination: '/learn', permanent: true },
      { source: '/admin', destination: '/', permanent: true },
      { source: '/admin/:path*', destination: '/', permanent: true },
      { source: '/teacher', destination: '/', permanent: true },
      { source: '/teacher/:path*', destination: '/', permanent: true },
    ]
  },
}

export default nextConfig
