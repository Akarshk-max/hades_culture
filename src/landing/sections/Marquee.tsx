const ITEMS = ['Rebirth SS26', 'Forged in Shadow', 'Hades Culture']

// One repeating copy of the marquee content. The track renders TWO of these
// back-to-back; the CSS animation translates by -50% so the loop is seamless.
function MarqueeCopy() {
  return (
    <span className="inline-flex items-center">
      {Array.from({ length: 4 }).map((_, rep) =>
        ITEMS.map((item, i) => (
          <span key={`${rep}-${i}`} className="inline-flex items-center">
            <span>{item}</span>
            <span className="mx-6 text-bronze" aria-hidden>
              ·
            </span>
          </span>
        ))
      )}
    </span>
  )
}

export function Marquee() {
  return (
    <div
      className="marquee-strip relative w-full overflow-hidden bg-ink"
      aria-hidden
    >
      <div className="flex h-[72px] items-center sm:h-[100px]">
        <div className="marquee-track font-display text-xl uppercase tracking-[0.35em] text-cream sm:text-2xl">
          <MarqueeCopy />
          <MarqueeCopy />
        </div>
      </div>
    </div>
  )
}
