// 3D Infinite Photo Gallery ("THE DROP")
// Ported from the 21st.dev "3d-gallery-photography" component into this project's
// React + Vite + TypeScript + Tailwind stack, with the following fixes applied vs.
// the original:
//   • NO scroll-jacking — wheel input is captured only on the gallery's OWN canvas
//     (via a ref, not document.querySelector) and is passive, so the page keeps
//     scrolling normally. Arrow-key nav is scoped to the focused gallery, not document.
//   • CORS — textures are loaded with crossOrigin="anonymous"; a texture that fails
//     to load is skipped (its plane is dropped) instead of crashing the whole scene.
//   • prefers-reduced-motion — autoplay drift and the shader ripple / flag-wave are
//     disabled; the gallery sits calm and static-ish.
//   • Mobile perf — renderer DPR is capped at [1, 2], visibleCount is lowered on
//     small screens, and the R3F render loop is paused (frameloop="never") whenever
//     the gallery is scrolled out of the viewport (IntersectionObserver).
//   • The WebGL-not-supported fallback grid is preserved.

import {
  useRef,
  useMemo,
  useCallback,
  useState,
  useEffect,
  type CSSProperties,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DEFAULT_DEPTH_RANGE = 50
const MAX_HORIZONTAL_OFFSET = 8
const MAX_VERTICAL_OFFSET = 8

export type GalleryImage = string | { src: string; alt?: string }

interface FadeSettings {
  fadeIn: { start: number; end: number }
  fadeOut: { start: number; end: number }
}

interface BlurSettings {
  blurIn: { start: number; end: number }
  blurOut: { start: number; end: number }
  maxBlur: number
}

interface InfiniteGalleryProps {
  images: GalleryImage[]
  speed?: number
  visibleCount?: number
  className?: string
  style?: CSSProperties
  fadeSettings?: FadeSettings
  blurSettings?: BlurSettings
  /** caption auto-hides after the first interaction */
  caption?: string
}

const createClothMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      map: { value: null },
      opacity: { value: 1.0 },
      blurAmount: { value: 0.0 },
      scrollForce: { value: 0.0 },
      time: { value: 0.0 },
      isHovered: { value: 0.0 },
    },
    vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normal;

        vec3 pos = position;

        float curveIntensity = scrollForce * 0.3;

        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;

        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;

        float flagWave = 0.0;
        if (isHovered > 0.5) {
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float waveAmplitude = sin(wavePhase) * 0.1;
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = waveAmplitude * dampening;

          float secondaryWave = sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
          flagWave += secondaryWave;
        }

        pos.z -= (curve + clothEffect + flagWave);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vec4 color = texture2D(map, vUv);

        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;

          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }

        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);

        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
  })

/* ── Texture loading with CORS + graceful per-image failure ──────────────── */
function useGalleryTextures(srcs: string[]) {
  const [textures, setTextures] = useState<THREE.Texture[]>([])
  const key = srcs.join('|')

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous') // images come from the Shopify CDN

    const loaded: THREE.Texture[] = []
    let remaining = srcs.length

    if (remaining === 0) {
      setTextures([])
      return
    }

    const settle = () => {
      remaining -= 1
      if (remaining === 0 && !cancelled) setTextures(loaded.slice())
    }

    srcs.forEach((src) => {
      loader.load(
        src,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          tex.minFilter = THREE.LinearMipmapLinearFilter
          tex.generateMipmaps = true
          loaded.push(tex) // only successful textures enter the pool
          settle()
        },
        undefined,
        () => {
          // Texture failed (CORS / 404 / network) — skip it, don't crash.
          if (import.meta.env.DEV) {
            console.warn(`[InfiniteGallery] skipped texture: ${src}`)
          }
          settle()
        }
      )
    })

    return () => {
      cancelled = true
      loaded.forEach((t) => t.dispose())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return textures
}

/* ── A single image plane ────────────────────────────────────────────────── */
interface ImagePlaneProps {
  position: [number, number, number]
  scale: [number, number, number]
  material: THREE.ShaderMaterial
  texture: THREE.Texture
  interactive: boolean
}

function ImagePlane({
  position,
  scale,
  material,
  texture,
  interactive,
}: ImagePlaneProps) {
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (material) material.uniforms.map.value = texture
  }, [material, texture])

  useEffect(() => {
    if (material?.uniforms) {
      material.uniforms.isHovered.value = interactive && isHovered ? 1.0 : 0.0
    }
  }, [material, isHovered, interactive])

  return (
    <mesh
      position={position}
      scale={scale}
      material={material}
      onPointerEnter={interactive ? () => setIsHovered(true) : undefined}
      onPointerLeave={interactive ? () => setIsHovered(false) : undefined}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
    </mesh>
  )
}

/* ── The animated scene ──────────────────────────────────────────────────── */
interface GallerySceneProps {
  textures: THREE.Texture[]
  speed: number
  visibleCount: number
  reducedMotion: boolean
  velocityRef: React.MutableRefObject<number>
  autoPlayRef: React.MutableRefObject<boolean>
  lastInteractionRef: React.MutableRefObject<number>
  fadeSettings: FadeSettings
  blurSettings: BlurSettings
}

function GalleryScene({
  textures,
  visibleCount,
  reducedMotion,
  velocityRef,
  autoPlayRef,
  lastInteractionRef,
  fadeSettings,
  blurSettings,
}: GallerySceneProps) {
  const totalImages = textures.length
  const depthRange = DEFAULT_DEPTH_RANGE

  const materials = useMemo(
    () => Array.from({ length: visibleCount }, () => createClothMaterial()),
    [visibleCount]
  )

  // Dispose shader materials when they are replaced / unmounted.
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  const spatialPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = []
    for (let i = 0; i < visibleCount; i++) {
      const horizontalAngle = (i * 2.618) % (Math.PI * 2)
      const verticalAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2)
      const horizontalRadius = (i % 3) * 1.2
      const verticalRadius = ((i + 1) % 4) * 0.8
      const x =
        (Math.sin(horizontalAngle) * horizontalRadius * MAX_HORIZONTAL_OFFSET) /
        3
      const y =
        (Math.cos(verticalAngle) * verticalRadius * MAX_VERTICAL_OFFSET) / 4
      positions.push({ x, y })
    }
    return positions
  }, [visibleCount])

  const planesData = useRef(
    Array.from({ length: visibleCount }, (_, i) => ({
      index: i,
      z: visibleCount > 0 ? ((depthRange / visibleCount) * i) % depthRange : 0,
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
    }))
  )

  useEffect(() => {
    planesData.current = Array.from({ length: visibleCount }, (_, i) => ({
      index: i,
      z:
        visibleCount > 0
          ? ((depthRange / Math.max(visibleCount, 1)) * i) % depthRange
          : 0,
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
    }))
  }, [depthRange, spatialPositions, totalImages, visibleCount])

  useFrame((state, delta) => {
    // Resume autoplay a few seconds after the last manual interaction.
    if (
      !reducedMotion &&
      !autoPlayRef.current &&
      Date.now() - lastInteractionRef.current > 3000
    ) {
      autoPlayRef.current = true
    }
    if (!reducedMotion && autoPlayRef.current) {
      velocityRef.current += 0.3 * delta
    }
    velocityRef.current *= 0.95
    const velocity = velocityRef.current

    const time = state.clock.getElapsedTime()
    materials.forEach((material) => {
      if (material?.uniforms) {
        // No ripple / wave when the user prefers reduced motion.
        material.uniforms.time.value = reducedMotion ? 0 : time
        material.uniforms.scrollForce.value = reducedMotion ? 0 : velocity
      }
    })

    const imageAdvance =
      totalImages > 0 ? visibleCount % totalImages || totalImages : 0
    const totalRange = depthRange

    planesData.current.forEach((plane, i) => {
      let newZ = plane.z + velocity * delta * 10
      let wrapsForward = 0
      let wrapsBackward = 0

      if (newZ >= totalRange) {
        wrapsForward = Math.floor(newZ / totalRange)
        newZ -= totalRange * wrapsForward
      } else if (newZ < 0) {
        wrapsBackward = Math.ceil(-newZ / totalRange)
        newZ += totalRange * wrapsBackward
      }

      if (wrapsForward > 0 && imageAdvance > 0 && totalImages > 0) {
        plane.imageIndex =
          (plane.imageIndex + wrapsForward * imageAdvance) % totalImages
      }
      if (wrapsBackward > 0 && imageAdvance > 0 && totalImages > 0) {
        const step = plane.imageIndex - wrapsBackward * imageAdvance
        plane.imageIndex = ((step % totalImages) + totalImages) % totalImages
      }

      plane.z = ((newZ % totalRange) + totalRange) % totalRange
      plane.x = spatialPositions[i]?.x ?? 0
      plane.y = spatialPositions[i]?.y ?? 0

      const normalizedPosition = plane.z / totalRange
      let opacity = 1
      if (
        normalizedPosition >= fadeSettings.fadeIn.start &&
        normalizedPosition <= fadeSettings.fadeIn.end
      ) {
        opacity =
          (normalizedPosition - fadeSettings.fadeIn.start) /
          (fadeSettings.fadeIn.end - fadeSettings.fadeIn.start)
      } else if (normalizedPosition < fadeSettings.fadeIn.start) {
        opacity = 0
      } else if (
        normalizedPosition >= fadeSettings.fadeOut.start &&
        normalizedPosition <= fadeSettings.fadeOut.end
      ) {
        opacity =
          1 -
          (normalizedPosition - fadeSettings.fadeOut.start) /
            (fadeSettings.fadeOut.end - fadeSettings.fadeOut.start)
      } else if (normalizedPosition > fadeSettings.fadeOut.end) {
        opacity = 0
      }
      opacity = Math.max(0, Math.min(1, opacity))

      let blur = 0
      if (
        normalizedPosition >= blurSettings.blurIn.start &&
        normalizedPosition <= blurSettings.blurIn.end
      ) {
        const blurInProgress =
          (normalizedPosition - blurSettings.blurIn.start) /
          (blurSettings.blurIn.end - blurSettings.blurIn.start)
        blur = blurSettings.maxBlur * (1 - blurInProgress)
      } else if (normalizedPosition < blurSettings.blurIn.start) {
        blur = blurSettings.maxBlur
      } else if (
        normalizedPosition >= blurSettings.blurOut.start &&
        normalizedPosition <= blurSettings.blurOut.end
      ) {
        const blurOutProgress =
          (normalizedPosition - blurSettings.blurOut.start) /
          (blurSettings.blurOut.end - blurSettings.blurOut.start)
        blur = blurSettings.maxBlur * blurOutProgress
      } else if (normalizedPosition > blurSettings.blurOut.end) {
        blur = blurSettings.maxBlur
      }
      blur = Math.max(0, Math.min(blurSettings.maxBlur, blur))

      const material = materials[i]
      if (material?.uniforms) {
        material.uniforms.opacity.value = opacity
        material.uniforms.blurAmount.value = blur
      }
    })
  })

  if (totalImages === 0) return null

  return (
    <>
      {planesData.current.map((plane, i) => {
        const texture = textures[plane.imageIndex]
        const material = materials[i]
        if (!texture || !material) return null

        const worldZ = plane.z - depthRange / 2
        const img = texture.image as
          | { width: number; height: number }
          | undefined
        const aspect = img && img.height ? img.width / img.height : 1
        const scale: [number, number, number] =
          aspect > 1 ? [2 * aspect, 2, 1] : [2, 2 / aspect, 1]

        return (
          <ImagePlane
            key={plane.index}
            texture={texture}
            position={[plane.x, plane.y, worldZ]}
            scale={scale}
            material={material}
            interactive={!reducedMotion}
          />
        )
      })}
    </>
  )
}

/* ── WebGL-not-supported fallback grid ───────────────────────────────────── */
function FallbackGallery({ images }: { images: GalleryImage[] }) {
  const normalized = useMemo(
    () => images.map((img) => (typeof img === 'string' ? { src: img } : img)),
    [images]
  )
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Showing the drop
      </p>
      <div className="grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {normalized.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={(img as { alt?: string }).alt ?? ''}
            loading="lazy"
            className="aspect-[3/4] w-full rounded-md object-cover"
          />
        ))}
      </div>
    </div>
  )
}

/* ── Small helpers ───────────────────────────────────────────────────────── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

/* ── Public component ────────────────────────────────────────────────────── */
export default function InfiniteGallery({
  images,
  speed = 1,
  visibleCount,
  className,
  style,
  caption,
  fadeSettings = {
    fadeIn: { start: 0.05, end: 0.25 },
    fadeOut: { start: 0.4, end: 0.43 },
  },
  blurSettings = {
    blurIn: { start: 0.0, end: 0.1 },
    blurOut: { start: 0.4, end: 0.43 },
    maxBlur: 8.0,
  },
}: InfiniteGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webglSupported, setWebglSupported] = useState(true)
  const [inView, setInView] = useState(true)
  const [showCaption, setShowCaption] = useState(Boolean(caption))

  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobile()

  // Shared interaction state between DOM handlers and the R3F scene.
  const velocityRef = useRef(0)
  const autoPlayRef = useRef(!reducedMotion)
  const lastInteractionRef = useRef(Date.now())

  const srcs = useMemo(
    () => images.map((img) => (typeof img === 'string' ? img : img.src)),
    [images]
  )
  const textures = useGalleryTextures(srcs)

  // 6 on mobile, 12 on desktop by default; an explicit prop is still clamped
  // down on small screens to protect battery / fill-rate.
  const effectiveVisibleCount = useMemo(() => {
    const base = visibleCount ?? (isMobile ? 6 : 12)
    return isMobile ? Math.min(base, 6) : base
  }, [visibleCount, isMobile])

  // WebGL support probe.
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) setWebglSupported(false)
    } catch {
      setWebglSupported(false)
    }
  }, [])

  // Pause the render loop when the gallery is scrolled out of the viewport.
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.01 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const noteInteraction = useCallback(() => {
    if (showCaption) setShowCaption(false)
    autoPlayRef.current = false
    lastInteractionRef.current = Date.now()
  }, [showCaption])

  // Wheel over the gallery nudges its depth — but PASSIVE, so the page still
  // scrolls normally (we never call preventDefault). Scoped to this element,
  // so it only fires while the pointer is actually over the gallery.
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (reducedMotion) return
      velocityRef.current += e.deltaY * 0.0015 * speed
      noteInteraction()
    },
    [reducedMotion, speed, noteInteraction]
  )

  // Arrow keys nudge — scoped to the focused gallery (tabIndex), not document.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        velocityRef.current -= 2 * speed
        noteInteraction()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        velocityRef.current += 2 * speed
        noteInteraction()
      }
    },
    [speed, noteInteraction]
  )

  const containerProps = {
    ref: containerRef,
    className,
    style,
    tabIndex: 0,
    role: 'region',
    'aria-label':
      'THE DROP — 3D product gallery. Use arrow keys or scroll to explore.',
  }

  if (!webglSupported) {
    return (
      <div {...containerProps}>
        <FallbackGallery images={images} />
      </div>
    )
  }

  return (
    <div
      {...containerProps}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onPointerDown={noteInteraction}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        frameloop={inView ? 'always' : 'never'}
      >
        <GalleryScene
          textures={textures}
          speed={speed}
          visibleCount={effectiveVisibleCount}
          reducedMotion={reducedMotion}
          velocityRef={velocityRef}
          autoPlayRef={autoPlayRef}
          lastInteractionRef={lastInteractionRef}
          fadeSettings={fadeSettings}
          blurSettings={blurSettings}
        />
      </Canvas>

      {showCaption && caption && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[0.7rem] uppercase tracking-[0.25em] text-cream/60">
          {caption}
        </p>
      )}
    </div>
  )
}
