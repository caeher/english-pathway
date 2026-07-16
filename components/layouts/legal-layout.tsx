import Link from 'next/link'
import { cn } from '@/lib/helpers'

interface LegalNavItem {
  label: string
  href: string
}

interface LegalLayoutProps {
  children: React.ReactNode
  title: string
  navItems?: LegalNavItem[]
  className?: string
}

const DEFAULT_NAV: LegalNavItem[] = [
  { label: 'Terms and Conditions', href: '/legal/terms' },
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Cookie Policy', href: '/legal/cookies' },
]

export function LegalLayout({
  children,
  title,
  navItems = DEFAULT_NAV,
  className,
}: LegalLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-(--bg-primary)', className)}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-(--text-muted) hover:text-(--accent) no-underline">
            ← Back to home
          </Link>
          <h1 className="font-display font-black text-3xl text-(--text-primary) mt-4">{title}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-56 shrink-0">
            <nav className="flex flex-col gap-1 sticky top-24">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-(--text-secondary) hover:text-(--accent) no-underline py-1.5 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <article className="flex-1 min-w-0 prose prose-neutral dark:prose-invert max-w-none legal-content">
            {children}
          </article>
        </div>
      </div>
    </div>
  )
}
