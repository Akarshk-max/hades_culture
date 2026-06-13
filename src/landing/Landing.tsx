import { lazy, Suspense } from 'react'

import { Hero } from '@/landing/sections/Hero'
import { FeaturedProducts } from '@/landing/sections/FeaturedProducts'
import { LandingFooter } from '@/landing/sections/LandingFooter'

// The 3D gallery pulls in three / r3f — code-split it so the hero paints fast.
const TheDrop = lazy(() =>
  import('@/landing/sections/TheDrop').then((m) => ({ default: m.TheDrop }))
)

export default function Landing() {
  return (
    <div className="landing-root relative min-h-screen">
      {/* Page-wide film-grain overlay */}
      <div className="film-grain" aria-hidden />

      <Hero />

      <Suspense
        fallback={
          <div className="flex h-[100svh] items-center justify-center bg-ink">
            <span className="font-display text-sm uppercase tracking-[0.4em] text-cream/50">
              Loading the drop…
            </span>
          </div>
        }
      >
        <TheDrop />
      </Suspense>

      <FeaturedProducts />
      <LandingFooter />
    </div>
  )
}
