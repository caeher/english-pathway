import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import type { Metadata, Viewport } from 'next'
import { Outfit, Nunito } from 'next/font/google'
import ClientProviders from '@/components/ClientProviders'
import { getAppUrl } from '@/lib/auth/app-url'
import { themeInitScript } from '@/lib/theme/theme-script'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: 'English Pathway — Learn English with guided practice',
    template: '%s | English Pathway',
  },
  description: 'Practice English with an AI tutor, a structured curriculum, and interactive activities.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'English Pathway — Learn English with guided practice',
    description: 'Practice English with an AI tutor, a structured curriculum, and interactive activities.',
    url: '/',
    siteName: 'English Pathway',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'English Pathway — Learn English with guided practice',
    description: 'Practice English with an AI tutor, a structured curriculum, and interactive activities.',
  },
}

export const viewport: Viewport = {
  themeColor: '#faf7f2',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  return (
    <html lang="en" className={`${outfit.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ClerkProvider dynamic>
          <ClientProviders isAuthenticated={Boolean(userId)}>{children}</ClientProviders>
        </ClerkProvider>
      </body>
    </html>
  )
}