import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import sitemap from '@/app/sitemap'
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents'

const root = resolve(process.cwd())

describe('Footer links and navigation integrity', () => {
  const footerContent = readFileSync(resolve(root, 'components/Footer.tsx'), 'utf8')

  it('contains valid links for all expected learning and resource destinations', () => {
    // Learning column
    expect(footerContent).toContain('href="/how-it-works"')
    expect(footerContent).toContain('href="/curriculum"')
    expect(footerContent).toContain('href="/learn"')
    expect(footerContent).toContain('href="/review"')

    // Resources column
    expect(footerContent).toContain('href="/faq"')
    expect(footerContent).toContain('href="/sign-up?redirectTo=%2Fonboarding"')
    expect(footerContent).toContain('href="/sign-in"')

    // Legal column
    expect(footerContent).toContain('href="/legal/terms"')
    expect(footerContent).toContain('href="/legal/privacy"')
    expect(footerContent).toContain('href="/legal/cookies"')

    // Brand and External
    expect(footerContent).toContain('href="/"')
    expect(footerContent).toContain('https://my.cubepath.com/register?ref=HEAC.CRE4389')
  })

  it('renders intended public pages matching the footer links', () => {
    expect(existsSync(resolve(root, 'app/(public)/how-it-works/page.tsx'))).toBe(true)
    expect(existsSync(resolve(root, 'app/(public)/faq/page.tsx'))).toBe(true)
    expect(existsSync(resolve(root, 'app/(legal)/legal/terms/page.tsx'))).toBe(true)
    expect(existsSync(resolve(root, 'app/(legal)/legal/privacy/page.tsx'))).toBe(true)
    expect(existsSync(resolve(root, 'app/(legal)/legal/cookies/page.tsx'))).toBe(true)
  })

  it('matches cookie policy link in CookieConsentBanner and Footer', () => {
    const bannerContent = readFileSync(resolve(root, 'components/CookieConsentBanner.tsx'), 'utf8')
    expect(bannerContent).toContain('href="/legal/cookies"')
    expect(footerContent).toContain('href="/legal/cookies"')

    // Verify cookies document exists in canonical legal document definitions
    const cookiesDoc = LEGAL_DOCUMENTS.find((doc) => doc.type === 'cookies')
    expect(cookiesDoc).toBeDefined()
    expect(cookiesDoc?.slug).toBe('cookies')
  })

  it('protects /review in proxy.ts for unauthenticated visitors with Clerk return flow', () => {
    const proxyContent = readFileSync(resolve(root, 'proxy.ts'), 'utf8')
    expect(proxyContent).toContain("'/review(.*)'")
    expect(proxyContent).toContain('await auth.protect()')
  })
})

describe('Clerk authentication migration - no active UI links to legacy auth', () => {
  const footerContent = readFileSync(resolve(root, 'components/Footer.tsx'), 'utf8')
  const headerContent = readFileSync(resolve(root, 'components/Header.tsx'), 'utf8')
  const landingContent = readFileSync(resolve(root, 'components/pages/Landing.tsx'), 'utf8')
  const friendlyErrorContent = readFileSync(resolve(root, 'components/ui/FriendlyError.tsx'), 'utf8')
  const settingsContent = readFileSync(resolve(root, 'components/pages/SettingsPage.tsx'), 'utf8')

  it('Footer contains no legacy auth links', () => {
    expect(footerContent).not.toContain('href="/login"')
    expect(footerContent).not.toContain('href="/register"')
    expect(footerContent).not.toContain('href="/forgot-password"')
    expect(footerContent).not.toContain('href="/reset-password"')
  })

  it('Header contains no legacy auth links', () => {
    expect(headerContent).not.toContain('href="/login"')
    expect(headerContent).not.toContain('href="/register"')
    expect(headerContent).not.toContain('href="/forgot-password"')
    expect(headerContent).not.toContain('href="/reset-password"')
    expect(headerContent).toContain('href="/sign-in"')
    expect(headerContent).toContain('href="/sign-up?redirectTo=%2Fonboarding"')
  })

  it('Landing page points visitor CTA to Clerk sign-up with onboarding return', () => {
    expect(landingContent).not.toContain("'/register?redirectTo=%2Fonboarding'")
    expect(landingContent).toContain("'/sign-up?redirectTo=%2Fonboarding'")
  })

  it('FriendlyError links to Clerk sign-in', () => {
    expect(friendlyErrorContent).not.toContain('href="/login"')
    expect(friendlyErrorContent).toContain('href="/sign-in"')
  })

  it('SettingsPage does not link to legacy password reset', () => {
    expect(settingsContent).not.toContain('href="/forgot-password"')
    expect(settingsContent).not.toContain('href="/reset-password"')
  })

  it('Sitemap contains Clerk auth routes instead of legacy ones', () => {
    const sitemapEntries = sitemap()
    const urls = sitemapEntries.map((e) => e.url)

    expect(urls.some((url) => url.endsWith('/login'))).toBe(false)
    expect(urls.some((url) => url.endsWith('/register'))).toBe(false)
    expect(urls.some((url) => url.endsWith('/sign-in'))).toBe(true)
    expect(urls.some((url) => url.endsWith('/sign-up'))).toBe(true)
  })

  it('proxy.ts and next.config.ts handle legacy auth redirects safely', () => {
    const proxyContent = readFileSync(resolve(root, 'proxy.ts'), 'utf8')
    const nextConfigContent = readFileSync(resolve(root, 'next.config.ts'), 'utf8')

    // Proxy redirects
    expect(proxyContent).toContain("pathname === '/login'")
    expect(proxyContent).toContain("url.pathname = '/sign-in'")
    expect(proxyContent).toContain("pathname === '/register'")
    expect(proxyContent).toContain("url.pathname = '/sign-up'")
    expect(proxyContent).toContain("pathname === '/forgot-password' || pathname === '/reset-password'")

    // Next.config redirects
    expect(nextConfigContent).toContain("destination: '/sign-in'")
    expect(nextConfigContent).toContain("destination: '/sign-up'")
  })
})
