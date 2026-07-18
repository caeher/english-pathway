import type { Metadata, Viewport } from 'next'
import { Outfit, Nunito } from 'next/font/google'
import ClientProviders from '@/components/ClientProviders'
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'English Pathway — Learn English with guided practice',
    template: '%s | English Pathway',
  },
  description: 'Practice English with an AI tutor, a structured curriculum, and interactive activities.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${nunito.variable}`} suppressHydrationWarning>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
