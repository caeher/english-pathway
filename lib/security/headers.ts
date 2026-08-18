export const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.accounts.dev https://*.clerk.com https://*.caeher.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://*.caeher.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.accounts.dev https://*.clerk.com https://*.caeher.com https://api.clerk.com https://clerk-telemetry.com https://challenges.cloudflare.com https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io wss://api.elevenlabs.io https://api.openai.com",
      "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.accounts.dev https://*.clerk.com https://*.caeher.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.clerk.accounts.dev https://*.accounts.dev https://*.clerk.com https://*.caeher.com",
    ].join('; '),
  },
]
