import Link from 'next/link'
import Image from 'next/image'
import { Heart, Sparkles, ArrowUpRight } from 'lucide-react'

const CUBEPATH_REFERRAL_URL = 'https://my.cubepath.com/register?ref=HEAC.CRE4389'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={`border-t border-(--border-primary) bg-(--bg-primary) text-(--text-primary) transition-colors ${className}`}
      aria-label="Footer"
    >
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand & Description */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="group inline-flex items-center gap-3 no-underline">
              <div className="relative h-9 w-9">
                <div className="absolute inset-0 rotate-3 rounded-xl bg-(--accent) transition-transform duration-300 group-hover:rotate-6" />
                <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-(--accent) text-white font-black shadow-sm">
                  <span className="font-display text-sm font-black tracking-tight">ep</span>
                </div>
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-(--text-primary) transition-colors group-hover:text-(--accent)">
                English Pathway
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-(--text-secondary)">
              Master English naturally through conversational AI tutoring, structured curriculum modules, and interactive recall activities.
            </p>

            <div className="pt-2">
              <a
                href={CUBEPATH_REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-xl border border-(--border-primary) bg-(--bg-card) px-3.5 py-2 text-xs font-medium text-(--text-secondary) shadow-2xs transition-all hover:border-(--accent) hover:text-(--text-primary)"
                aria-label="Hosted on CubePath (opens in a new tab)"
              >
                <span className="rounded-md bg-white px-1.5 py-0.5 shadow-2xs">
                  <Image
                    src="/logo-light.png"
                    alt="CubePath"
                    width={100}
                    height={20}
                    className="h-4 w-auto object-contain"
                  />
                </span>
                <span>Hosted on CubePath</span>
                <ArrowUpRight className="h-3 w-3 text-(--text-muted) transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-(--accent)" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Navigation Column 1: Learning */}
          <div className="space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-(--text-primary)">
              Learning
            </p>
            <ul className="space-y-2.5 text-sm text-(--text-secondary)">
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-(--accent) no-underline">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/curriculum" className="transition-colors hover:text-(--accent) no-underline">
                  Curriculum
                </Link>
              </li>
              <li>
                <Link href="/learn" className="inline-flex items-center gap-1.5 transition-colors hover:text-(--accent) no-underline">
                  AI Tutor
                  <span className="inline-flex items-center rounded-full bg-(--accent-soft) px-1.5 py-0.5 text-[10px] font-semibold text-(--accent)">
                    <Sparkles className="mr-0.5 h-2.5 w-2.5" aria-hidden="true" />
                    Live
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/review" className="transition-colors hover:text-(--accent) no-underline">
                  Spaced Review
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Resources */}
          <div className="space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-(--text-primary)">
              Resources
            </p>
            <ul className="space-y-2.5 text-sm text-(--text-secondary)">
              <li>
                <Link href="/faq" className="transition-colors hover:text-(--accent) no-underline">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/register?redirectTo=%2Fonboarding" className="transition-colors hover:text-(--accent) no-underline">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-(--accent) no-underline">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Legal */}
          <div className="space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-(--text-primary)">
              Legal
            </p>
            <ul className="space-y-2.5 text-sm text-(--text-secondary)">
              <li>
                <Link href="/legal/terms" className="transition-colors hover:text-(--accent) no-underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="transition-colors hover:text-(--accent) no-underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="transition-colors hover:text-(--accent) no-underline">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer / Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-(--border-primary)/60 pt-8 sm:flex-row text-xs sm:text-sm text-(--text-muted)">
          <p>© {currentYear} English Pathway. All rights reserved.</p>

          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <Heart
              className="h-3.5 w-3.5 fill-rose-500 text-rose-500 transition-transform duration-200 hover:scale-125"
              aria-label="love"
            />
            <span>by</span>
            <a
              href="https://caeher.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-(--text-primary) underline decoration-(--border-secondary) underline-offset-4 transition-colors hover:text-(--accent) hover:decoration-(--accent)"
            >
              caeher.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
