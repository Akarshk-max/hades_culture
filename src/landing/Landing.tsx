import { Hero } from '@/landing/sections/Hero'
import { Marquee } from '@/landing/sections/Marquee'
import { TheDrop } from '@/landing/sections/TheDrop'
import { FeaturedProducts } from '@/landing/sections/FeaturedProducts'
import { LandingFooter } from '@/landing/sections/LandingFooter'

export default function Landing() {
  return (
    <div className="landing-root relative min-h-screen">
      {/* Page-wide film-grain overlay */}
      <div className="film-grain" aria-hidden />

      <Hero />
      <Marquee />
      <TheDrop />
      <FeaturedProducts />
      <LandingFooter />
    </div>
  )
}
