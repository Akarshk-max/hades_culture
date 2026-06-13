import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import {
  HERO_FALLBACK,
  MONTAGE_CLIPS,
  MONTAGE_POSTER,
} from '@/landing/data'

const CROSSFADE_MS = 300
// Start the crossfade slightly before the clip truly ends so the swap is seamless.
const LEAD_SECONDS = 0.15

type Slot = 'a' | 'b'

/** Centered "SS26 / REBIRTH" overlay — readable over any frame via blend mode. */
function MontageText() {
  const prefersReduced = useReducedMotion()
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center"
    >
      <span className="mb-3 font-sans text-xs uppercase tracking-[0.5em] text-cream mix-blend-exclusion sm:text-sm">
        SS26
      </span>
      <h2
        className="select-none font-serif italic uppercase tracking-tight text-cream mix-blend-exclusion text-[clamp(3.5rem,17vw,13rem)] leading-[0.85]"
      >
        Rebirth
      </h2>
    </motion.div>
  )
}

export function TheDrop() {
  const prefersReduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const aRef = useRef<HTMLVideoElement>(null)
  const bRef = useRef<HTMLVideoElement>(null)

  // `visible` drives the opacity crossfade; everything else lives in a ref so the
  // 60fps timeupdate handler never triggers React re-renders.
  const [visible, setVisible] = useState<Slot>('a')
  const [allDead, setAllDead] = useState(false)

  const st = useRef({
    active: 'a' as Slot,
    aClip: 0,
    bClip: 1,
    transitioning: false,
    inView: false,
    dead: new Set<number>(),
    started: false,
  })

  const clips = MONTAGE_CLIPS
  const n = clips.length

  const getEl = useCallback(
    (slot: Slot) => (slot === 'a' ? aRef.current : bRef.current),
    []
  )

  // Next clip index that hasn't failed to load. Returns -1 if none remain.
  const nextAlive = useCallback(
    (from: number) => {
      for (let i = 1; i <= n; i++) {
        const idx = (from + i) % n
        if (!st.current.dead.has(idx)) return idx
      }
      return -1
    },
    [n]
  )

  const setSlotClip = useCallback(
    (slot: Slot, clipIdx: number) => {
      const el = getEl(slot)
      if (!el) return
      if (slot === 'a') st.current.aClip = clipIdx
      else st.current.bClip = clipIdx
      el.src = clips[clipIdx]
      el.load()
    },
    [clips, getEl]
  )

  const doTransition = useCallback(() => {
    const s = st.current
    if (s.transitioning || prefersReduced || allDead) return

    const nextSlot: Slot = s.active === 'a' ? 'b' : 'a'
    const nextEl = getEl(nextSlot)
    const nextClip = nextSlot === 'a' ? s.aClip : s.bClip
    if (!nextEl || nextClip < 0) return

    s.transitioning = true
    nextEl.currentTime = 0
    void nextEl.play().catch(() => {})

    setVisible(nextSlot)
    s.active = nextSlot

    // After the crossfade, load the *following* clip into the now-hidden element.
    window.setTimeout(() => {
      const hiddenSlot: Slot = nextSlot === 'a' ? 'b' : 'a'
      const following = nextAlive(nextClip)
      if (following >= 0) setSlotClip(hiddenSlot, following)
      s.transitioning = false
    }, CROSSFADE_MS + 40)
  }, [prefersReduced, allDead, getEl, nextAlive, setSlotClip])

  const maybeAdvance = useCallback(
    (slot: Slot) => {
      if (slot !== st.current.active) return
      const el = getEl(slot)
      if (!el || !Number.isFinite(el.duration) || el.duration === 0) return
      if (el.duration - el.currentTime <= LEAD_SECONDS) doTransition()
    },
    [getEl, doTransition]
  )

  const handleError = useCallback(
    (slot: Slot) => {
      const s = st.current
      const clipIdx = slot === 'a' ? s.aClip : s.bClip
      s.dead.add(clipIdx)
      if (s.dead.size >= n) {
        setAllDead(true)
        return
      }
      // Reload this slot with a fresh, still-alive clip (≠ the other slot's clip).
      const otherClip = slot === 'a' ? s.bClip : s.aClip
      let cand = nextAlive(clipIdx)
      if (cand === otherClip) cand = nextAlive(cand)
      if (cand >= 0) {
        setSlotClip(slot, cand)
        if (slot === s.active && s.inView) {
          const el = getEl(slot)
          void el?.play().catch(() => {})
        }
      }
    },
    [n, nextAlive, setSlotClip, getEl]
  )

  // Initial buffer load (skipped under reduced motion — static poster instead).
  useEffect(() => {
    if (prefersReduced || n === 0) return
    const a = aRef.current
    const b = bRef.current
    if (!a || !b) return
    a.muted = true
    b.muted = true
    st.current.aClip = 0
    st.current.bClip = n > 1 ? 1 : 0
    a.src = clips[0]
    a.load()
    if (n > 1) {
      b.src = clips[1]
      b.load()
    }
  }, [prefersReduced, clips, n])

  // Pause when out of view; play the active clip when scrolled back in.
  useEffect(() => {
    if (prefersReduced) return
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver(
      ([entry]) => {
        const s = st.current
        s.inView = entry.isIntersecting
        if (entry.isIntersecting) {
          const active = getEl(s.active)
          void active?.play().catch(() => {})
          s.started = true
        } else {
          aRef.current?.pause()
          bRef.current?.pause()
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [prefersReduced, getEl])

  // If autoplay is blocked, resume on the first user interaction.
  useEffect(() => {
    if (prefersReduced) return
    const resume = () => {
      const s = st.current
      if (s.inView && !s.started) {
        const active = getEl(s.active)
        void active?.play().catch(() => {})
        s.started = true
      }
    }
    const opts = { passive: true } as AddEventListenerOptions
    window.addEventListener('scroll', resume, opts)
    window.addEventListener('touchstart', resume, opts)
    window.addEventListener('click', resume, opts)
    return () => {
      window.removeEventListener('scroll', resume)
      window.removeEventListener('touchstart', resume)
      window.removeEventListener('click', resume)
    }
  }, [prefersReduced, getEl])

  const showVideos = !prefersReduced && !allDead && n > 0

  return (
    <section
      ref={sectionRef}
      id="the-drop"
      className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-ink"
    >
      {/* Base fallback layer — guarantees no black flash before clips load */}
      <img
        src={MONTAGE_POSTER}
        alt=""
        aria-hidden
        onError={(e) => {
          // No poster yet → fall back to a dramatic product shot.
          if (e.currentTarget.src !== HERO_FALLBACK)
            e.currentTarget.src = HERO_FALLBACK
        }}
        className="absolute inset-0 z-0 h-full w-full object-cover object-center"
      />

      {showVideos && (
        <>
          <video
            ref={aRef}
            muted
            playsInline
            preload="auto"
            poster={MONTAGE_POSTER}
            onTimeUpdate={() => maybeAdvance('a')}
            onEnded={() => maybeAdvance('a')}
            onError={() => handleError('a')}
            className="absolute inset-0 z-10 h-full w-full object-cover object-center transition-opacity duration-300 ease-out"
            style={{ opacity: visible === 'a' ? 1 : 0 }}
          />
          <video
            ref={bRef}
            muted
            playsInline
            preload="auto"
            onTimeUpdate={() => maybeAdvance('b')}
            onEnded={() => maybeAdvance('b')}
            onError={() => handleError('b')}
            className="absolute inset-0 z-10 h-full w-full object-cover object-center transition-opacity duration-300 ease-out"
            style={{ opacity: visible === 'b' ? 1 : 0 }}
          />
        </>
      )}

      {/* Flat dark wash unifies tone with the hero + keeps REBIRTH legible */}
      <div
        aria-hidden
        className="absolute inset-0 z-20"
        style={{ backgroundColor: 'rgba(10,10,11,0.45)' }}
      />

      {/* Top edge dissolves from the shared black (#0A0A0B) → no hard seam */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-20 h-32"
        style={{ background: 'linear-gradient(to top, transparent, #0A0A0B)' }}
      />

      {/* Dark vignette / gradient for text contrast */}
      <div
        aria-hidden
        className="absolute inset-0 z-20"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <MontageText />

      {/* Section label */}
      <span className="pointer-events-none absolute left-6 top-6 z-30 font-display text-sm uppercase tracking-[0.4em] text-cream/70 mix-blend-exclusion">
        The Drop
      </span>
    </section>
  )
}
