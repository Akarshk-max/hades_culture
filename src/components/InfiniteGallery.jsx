// Ported from the 21st.dev "3d-gallery-photography" component (originally TSX +
// Tailwind) into this project's React + Vite + plain-CSS stack. TypeScript types
// removed; the Three.js / react-three-fiber logic is unchanged. Fallback markup
// uses project CSS classes instead of Tailwind.
import { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

const DEFAULT_DEPTH_RANGE = 50
const MAX_HORIZONTAL_OFFSET = 8
const MAX_VERTICAL_OFFSET = 8

const createClothMaterial = () => {
  return new THREE.ShaderMaterial({
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
}

function ImagePlane({ texture, position, scale, material }) {
  const meshRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (material && texture) {
      material.uniforms.map.value = texture
    }
  }, [material, texture])

  useEffect(() => {
    if (material && material.uniforms) {
      material.uniforms.isHovered.value = isHovered ? 1.0 : 0.0
    }
  }, [material, isHovered])

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      material={material}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
    </mesh>
  )
}

function GalleryScene({
  images,
  speed = 1,
  visibleCount = 8,
  fadeSettings = {
    fadeIn: { start: 0.05, end: 0.15 },
    fadeOut: { start: 0.85, end: 0.95 },
  },
  blurSettings = {
    blurIn: { start: 0.0, end: 0.1 },
    blurOut: { start: 0.9, end: 1.0 },
    maxBlur: 3.0,
  },
}) {
  // NOTE: velocity/autoplay are refs, not state. The original component called
  // setState every frame inside useFrame, which re-rendered React 60×/sec and
  // janked the whole page. Refs let the animation mutate freely with zero renders.
  const scrollVelocity = useRef(0)
  const autoPlay = useRef(true)
  const lastInteraction = useRef(Date.now())

  const normalizedImages = useMemo(
    () =>
      images.map((img) =>
        typeof img === 'string' ? { src: img, alt: '' } : img
      ),
    [images]
  )

  const textures = useTexture(normalizedImages.map((img) => img.src))

  const materials = useMemo(
    () => Array.from({ length: visibleCount }, () => createClothMaterial()),
    [visibleCount]
  )

  const spatialPositions = useMemo(() => {
    const positions = []
    const maxHorizontalOffset = MAX_HORIZONTAL_OFFSET
    const maxVerticalOffset = MAX_VERTICAL_OFFSET

    for (let i = 0; i < visibleCount; i++) {
      const horizontalAngle = (i * 2.618) % (Math.PI * 2)
      const verticalAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2)

      const horizontalRadius = (i % 3) * 1.2
      const verticalRadius = ((i + 1) % 4) * 0.8

      const x =
        (Math.sin(horizontalAngle) * horizontalRadius * maxHorizontalOffset) / 3
      const y =
        (Math.cos(verticalAngle) * verticalRadius * maxVerticalOffset) / 4

      positions.push({ x, y })
    }

    return positions
  }, [visibleCount])

  const totalImages = normalizedImages.length
  const depthRange = DEFAULT_DEPTH_RANGE

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

  // Arrow keys add a velocity nudge. Wheel is intentionally NOT hijacked so the
  // page keeps scrolling smoothly while the gallery auto-plays underneath.
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        scrollVelocity.current -= 2 * speed
        autoPlay.current = false
        lastInteraction.current = Date.now()
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        scrollVelocity.current += 2 * speed
        autoPlay.current = false
        lastInteraction.current = Date.now()
      }
    },
    [speed]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useFrame((state, delta) => {
    // Resume auto-play a few seconds after the last manual nudge
    if (!autoPlay.current && Date.now() - lastInteraction.current > 3000) {
      autoPlay.current = true
    }
    if (autoPlay.current) {
      scrollVelocity.current += 0.3 * delta
    }
    scrollVelocity.current *= 0.95
    const velocity = scrollVelocity.current

    const time = state.clock.getElapsedTime()
    materials.forEach((material) => {
      if (material && material.uniforms) {
        material.uniforms.time.value = time
        material.uniforms.scrollForce.value = velocity
      }
    })

    const imageAdvance =
      totalImages > 0 ? visibleCount % totalImages || totalImages : 0
    const totalRange = depthRange
    const halfRange = totalRange / 2

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
        const fadeInProgress =
          (normalizedPosition - fadeSettings.fadeIn.start) /
          (fadeSettings.fadeIn.end - fadeSettings.fadeIn.start)
        opacity = fadeInProgress
      } else if (normalizedPosition < fadeSettings.fadeIn.start) {
        opacity = 0
      } else if (
        normalizedPosition >= fadeSettings.fadeOut.start &&
        normalizedPosition <= fadeSettings.fadeOut.end
      ) {
        const fadeOutProgress =
          (normalizedPosition - fadeSettings.fadeOut.start) /
          (fadeSettings.fadeOut.end - fadeSettings.fadeOut.start)
        opacity = 1 - fadeOutProgress
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
      if (material && material.uniforms) {
        material.uniforms.opacity.value = opacity
        material.uniforms.blurAmount.value = blur
      }
    })
  })

  if (normalizedImages.length === 0) return null

  return (
    <>
      {planesData.current.map((plane, i) => {
        const texture = textures[plane.imageIndex]
        const material = materials[i]

        if (!texture || !material) return null

        const worldZ = plane.z - depthRange / 2

        const aspect = texture.image
          ? texture.image.width / texture.image.height
          : 1
        const scale =
          aspect > 1 ? [2 * aspect, 2, 1] : [2, 2 / aspect, 1]

        return (
          <ImagePlane
            key={plane.index}
            texture={texture}
            position={[plane.x, plane.y, worldZ]}
            scale={scale}
            material={material}
          />
        )
      })}
    </>
  )
}

function FallbackGallery({ images }) {
  const normalizedImages = useMemo(
    () =>
      images.map((img) =>
        typeof img === 'string' ? { src: img, alt: '' } : img
      ),
    [images]
  )

  return (
    <div className="gallery-fallback">
      <p>3D view not supported on this device — showing products:</p>
      <div className="gallery-fallback-grid">
        {normalizedImages.map((img, i) => (
          <img key={i} src={img.src} alt={img.alt} loading="lazy" />
        ))}
      </div>
    </div>
  )
}

export default function InfiniteGallery({
  images,
  speed,
  visibleCount,
  className = 'gallery-canvas',
  style,
  fadeSettings = {
    fadeIn: { start: 0.05, end: 0.25 },
    fadeOut: { start: 0.4, end: 0.43 },
  },
  blurSettings = {
    blurIn: { start: 0.0, end: 0.1 },
    blurOut: { start: 0.4, end: 0.43 },
    maxBlur: 8.0,
  },
}) {
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) {
        setWebglSupported(false)
      }
    } catch (e) {
      setWebglSupported(false)
    }
  }, [])

  if (!webglSupported) {
    return (
      <div className={className} style={style}>
        <FallbackGallery images={images} />
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      <Canvas
        camera={{ position: [0, 0, 0], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
      >
        <GalleryScene
          images={images}
          speed={speed}
          visibleCount={visibleCount}
          fadeSettings={fadeSettings}
          blurSettings={blurSettings}
        />
      </Canvas>
    </div>
  )
}
