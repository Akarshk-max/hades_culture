import { useMemo, useState, Suspense, lazy } from 'react'
import products from '../data/products.js'
import { cdnImg } from '../utils.js'

// Lazy-load the 3D gallery (and all of three.js) only when it's actually shown,
// so the heavy WebGL bundle never blocks the initial page load.
const InfiniteGallery = lazy(() => import('./InfiniteGallery.jsx'))

const STORAGE_KEY = 'hades_3d_enabled'

// Build the gallery image set from our real product photos (resized via the CDN
// so textures load fast). Two images per product for variety.
function buildProductImages() {
  const imgs = []
  products.forEach((p) => {
    p.images.slice(0, 2).forEach((src) => {
      imgs.push({ src: cdnImg(src, 800), alt: p.title })
    })
  })
  return imgs
}

export default function ImmersiveGallery() {
  const images = useMemo(buildProductImages, [])
  // Defaults ON (always runs), but the choice is remembered per visitor.
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'off'
    } catch {
      return true
    }
  })

  function toggle() {
    setEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <section className="immersive" aria-label="3D product gallery">
      <button
        className={`immersive-toggle ${enabled ? 'on' : ''}`}
        onClick={toggle}
        aria-pressed={enabled}
        title="Toggle the 3D experience"
      >
        <span className="dot" /> 3D {enabled ? 'ON' : 'OFF'}
      </button>

      {enabled ? (
        <>
          <Suspense fallback={<div className="immersive-loading">Entering the underworld…</div>}>
            <InfiniteGallery
              images={images}
              speed={1.2}
              visibleCount={12}
              className="gallery-canvas"
            />
          </Suspense>

          <div className="immersive-overlay">
            <span className="immersive-eyebrow">REBIRTH · SS26</span>
            <h2 className="immersive-title">THE COLLECTION</h2>
          </div>

          <div className="immersive-hint">
            <p>Auto-playing · arrow keys to steer</p>
          </div>
        </>
      ) : (
        <div className="immersive-static">
          <span className="immersive-eyebrow">REBIRTH · SS26</span>
          <h2 className="immersive-title">THE COLLECTION</h2>
          <div className="immersive-static-grid">
            {images.slice(0, 6).map((img, i) => (
              <img key={i} src={img.src} alt={img.alt} loading="lazy" />
            ))}
          </div>
          <span className="immersive-note">3D experience is off — tap “3D OFF” to turn it on</span>
        </div>
      )}
    </section>
  )
}
