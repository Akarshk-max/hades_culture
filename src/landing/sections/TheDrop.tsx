import InfiniteGallery from '@/components/ui/3d-gallery-photography'
import { GALLERY_IMAGES } from '@/landing/data'

export function TheDrop() {
  return (
    <section
      id="the-drop"
      className="relative h-[100svh] w-full overflow-hidden bg-ink"
    >
      <InfiniteGallery
        images={GALLERY_IMAGES}
        speed={1.2}
        visibleCount={12}
        caption="Scroll, arrow keys, or drag to explore"
        className="relative h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-bronze/60 focus-visible:ring-inset"
      />

      {/* Centered overlay word — mix-blend so it reads against any frame */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <h2
          className="select-none font-serif italic text-cream mix-blend-difference text-[clamp(3rem,14vw,11rem)] leading-none"
          style={{ textShadow: '0 0 40px rgba(0,0,0,0.4)' }}
        >
          Rebirth
        </h2>
      </div>

      {/* Section label */}
      <span className="pointer-events-none absolute left-6 top-6 z-10 font-display text-sm uppercase tracking-[0.4em] text-cream/70">
        The Drop
      </span>
    </section>
  )
}
