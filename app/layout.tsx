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
  title: 'English Pathway — Learn the Fun Way',
  description: 'Interactive English learning games. Vocabulary, grammar, pronunciation, and more.',
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
