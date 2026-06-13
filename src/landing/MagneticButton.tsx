import { useRef, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MagneticButtonProps {
  href: string
  children: ReactNode
  variant?: 'default' | 'outline'
  className?: string
  /** max px the button drifts toward the cursor */
  strength?: number
}

/**
 * A link styled as a shadcn button that gently follows the cursor (magnetic
 * hover) and grows an underline on hover. Movement is disabled when the user
 * prefers reduced motion; the visible focus ring (from buttonVariants) remains.
 */
export function MagneticButton({
  href,
  children,
  variant = 'default',
  className,
  strength = 8,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  const prefersReduced = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 250, damping: 18 })
  const springY = useSpring(y, { stiffness: 250, damping: 18 })

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    x.set(Math.max(-strength, Math.min(strength, (relX / rect.width) * strength * 2)))
    y.set(Math.max(-strength, Math.min(strength, (relY / rect.height) * strength * 2)))
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const isExternal = href.startsWith('http')

  return (
    <motion.a
      ref={ref}
      href={href}
      target={isExternal ? '_self' : undefined}
      rel={isExternal ? 'noopener' : undefined}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={prefersReduced ? undefined : { x: springX, y: springY }}
      className={cn(
        buttonVariants({ variant, size: 'lg' }),
        'group relative overflow-hidden',
        className
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
      {/* underline-grow accent */}
      <span
        aria-hidden
        className={cn(
          'absolute bottom-2 left-1/2 h-[2px] w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-2/3',
          variant === 'default' ? 'bg-primary-foreground/70' : 'bg-primary'
        )}
      />
    </motion.a>
  )
}
