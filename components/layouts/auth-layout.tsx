import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/helpers'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function AuthLayout({
  children,
  title = 'English Pathway',
  description = 'Learn English interactively through browser games. Build vocabulary, grammar, and confidence one round at a time.',
  className,
}: AuthLayoutProps) {
  return (
    <div className={cn('flex min-h-screen', className)}>
      {/* Image panel — fixed, no scroll */}
      <div className="relative hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-1/2 xl:w-[55%] shrink-0 overflow-hidden bg-(--accent-soft)">
        <Image
          src="/images/auth-hero.svg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1280px) 55vw, 50vw"
        />
        {/* Brand color filter overlay */}
        <div className="absolute inset-0 bg-(--accent) mix-blend-color opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/35 to-black/70" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
          <Link
            href="/"
            className="group inline-flex max-w-md flex-col gap-3 no-underline"
          >
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur-sm">
                🇬🇧
              </span>
              <span className="font-display text-sm font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                English Pathway
              </span>
            </span>
            <h2 className="font-display text-3xl xl:text-4xl font-black text-white leading-tight group-hover:text-white/95 transition-colors">
              {title}
            </h2>
          </Link>
          <p className="text-white/80 text-base xl:text-lg max-w-md leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Form panel — scrollable */}
      <div className="flex flex-1 flex-col min-h-screen bg-(--bg-primary)">
        <div className="lg:hidden border-b border-(--border-primary) px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 no-underline group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--accent-soft) text-base">
              🇬🇧
            </span>
            <span className="font-display text-sm font-bold text-(--text-primary) group-hover:text-(--accent) transition-colors">
              English Pathway
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
