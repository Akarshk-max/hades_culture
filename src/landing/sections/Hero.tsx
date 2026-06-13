import { useEffect, useState } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion'

import { MagneticButton } from '@/landing/MagneticButton'
import { HERO_FALLBACK, SHOP_ALL, SHOP_REBIRTH } from '@/landing/data'

/** True on small screens or data-saver / slow connections — skip the video. */
function useStaticHero() {
  const [isStatic, setIsStatic] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    // @ts-expect-error - Network Information API is not in the TS DOM lib
    const conn = navigator.connection as
      | { saveData?: boolean; effectiveType?: string }
      | undefined
    const slow =
      Boolean(conn?.saveData) ||
      ['slow-2g', '2g'].includes(conn?.effectiveType ?? '')
    const update = () => setIsStatic(mq.matches || slow)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isStatic
}

export function Hero() {
  const prefersReduced = useReducedMotion()
  const staticHero = useStaticHero()
  const { scrollY } = useScroll()
  const cueOpacity = useTransform(scrollY, [0, 300], [1, 0])

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: prefersReduced ? 0 : 0.12, delayChildren: 0.1 },
    },
  }
  const item: Variants = prefersReduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
      }

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-ink">
      {/* Fallback / base background image (always present, video covers it) */}
      <img
        src={HERO_FALLBACK}
        alt=""
        aria-hidden
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Real photoshoot footage — skipped on mobile / slow connections */}
      {!staticHero && (
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/media/hero-poster.jpg"
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
      )}

      {/* Dark gradient overlay for text contrast */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Bottom edge dissolves into shared black (#0A0A0B) → no hard seam */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-[5] h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, #0A0A0B)' }}
      />

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <motion.p
          variants={item}
          className="mb-4 font-sans text-xs uppercase tracking-[0.5em] text-bronze sm:text-sm"
        >
          Rebirth — SS26
        </motion.p>

        <motion.h1
          variants={item}
          className="font-display uppercase leading-[0.85] tracking-tight text-cream text-[clamp(3.5rem,16vw,13rem)]"
        >
          Hades Culture
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-5 max-w-md font-sans text-sm text-cream/70 sm:text-base"
        >
          Streetwear forged in shadow. A mythology reborn.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <MagneticButton href={SHOP_ALL} variant="default">
            Shop the Drop
          </MagneticButton>
          <MagneticButton href={SHOP_REBIRTH} variant="outline">
            Rebirth SS26
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Scroll cue — fades as the user scrolls */}
      <motion.div
        style={{ opacity: cueOpacity }}
        className="pointer-events-none absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-sans text-[0.6rem] uppercase tracking-[0.3em] text-cream/60">
          Scroll
        </span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-cream/40 p-1">
          <motion.span
            className="h-2 w-1 rounded-full bg-cream/70"
            animate={prefersReduced ? undefined : { y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </motion.div>
    </section>
  )
}
