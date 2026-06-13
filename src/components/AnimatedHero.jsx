import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MoveRight, Flame } from 'lucide-react'

// Adapted from the 21st.dev animated-hero (shadcn/Tailwind/TS original)
// into this project's React + Vite + plain-CSS stack, themed for Hades Culture.
export default function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(
    () => ['ashes', 'shadow', 'silence', 'the dark', 'the dead'],
    []
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((n) => (n === titles.length - 1 ? 0 : n + 1))
    }, 2200)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  return (
    <section className="hero">
      {/* Base layer: gradient shows through if the video/poster fail to load */}
      <div className="hero-bg" />
      {/* Looping background video. Drop hero.mp4 / hero.webm + hero-poster.jpg
          into /public. The poster JPG is the static fallback. */}
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        poster="/hero-poster.jpg"
      >
        <source src="/hero.webm" type="video/webm" />
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      {/* Dark gradient overlay for heading legibility */}
      <div className="hero-overlay" />
      <div className="hero-inner hero-animated">
        <div className="hero-pill">
          <Flame className="hero-pill-icon" size={15} />
          Rebirth SS26 has dropped
        </div>

        <h1 className="hero-title hero-title-animated">
          <span className="hero-static">RISE FROM</span>
          <span className="hero-rotator">
            &nbsp;
            {titles.map((title, index) => (
              <motion.span
                key={index}
                className="hero-word"
                initial={{ opacity: 0, y: -100 }}
                transition={{ type: 'spring', stiffness: 50 }}
                animate={
                  titleNumber === index
                    ? { y: 0, opacity: 1 }
                    : { y: titleNumber > index ? -160 : 160, opacity: 0 }
                }
              >
                {title}
              </motion.span>
            ))}
          </span>
        </h1>

        <p className="hero-sub">
          Streetwear forged in shadow. Limited drops, built to outlast the season.
        </p>

        <div className="hero-cta-row">
          <a href="#shop" className="btn btn-solid">
            SHOP NOW <MoveRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
