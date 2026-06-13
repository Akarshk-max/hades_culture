import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { INSTAGRAM, SHOP_ALL } from '@/landing/data'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export function LandingFooter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    // No backend — this is a styled stub. Shopify owns real signups.
    setSubmitted(true)
  }

  return (
    <footer className="border-t border-border bg-ink px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        {/* Top row: brand + email capture */}
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-3xl uppercase tracking-tight text-cream">
              Hades Culture
            </p>
            <p className="mt-2 max-w-xs font-sans text-sm text-muted-foreground">
              Rebirth — SS26. A mythology reborn in shadow.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <label
              htmlFor="footer-email"
              className="mb-2 block font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground"
            >
              Join the cult
            </label>
            {submitted ? (
              <p className="font-sans text-sm text-bronze" role="status">
                You&apos;re on the list. Welcome to the underworld.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-11 flex-1 rounded-md border border-border bg-surface px-3 font-sans text-sm text-cream placeholder:text-muted-foreground focus-visible:border-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit">Join</Button>
              </form>
            )}
          </div>
        </div>

        {/* Social row — Instagram first */}
        <div className="flex flex-wrap items-center gap-5">
          <a
            href={INSTAGRAM}
            rel="noopener noreferrer"
            target="_blank"
            aria-label="Hades Culture on Instagram"
            className="inline-flex items-center gap-2 font-sans text-sm text-cream transition-colors hover:text-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <InstagramIcon className="h-5 w-5" />
            Instagram
          </a>
        </div>

        {/* Bottom: legal + links */}
        <div className="flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hades Culture. All rights reserved.</p>
          <nav className="flex flex-wrap gap-5 font-sans uppercase tracking-wider">
            <a href={SHOP_ALL} rel="noopener" className="hover:text-cream">
              Store
            </a>
            <Link to="/shop" className="hover:text-cream">
              Browse Demo Shop
            </Link>
            <a href="#" className="hover:text-cream">
              Privacy
            </a>
            <a href="#" className="hover:text-cream">
              Terms
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
