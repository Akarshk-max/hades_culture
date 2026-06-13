import { motion, useReducedMotion } from 'framer-motion'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FEATURED, formatINR, type FeaturedProduct } from '@/landing/data'

function ProductCard({ product, index }: { product: FeaturedProduct; index: number }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: prefersReduced ? 0 : (index % 3) * 0.08 }}
    >
      <Card className="group overflow-hidden border-border/70 bg-surface transition-colors hover:border-bronze/50">
        <a
          href={product.url}
          rel="noopener"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          aria-label={`View ${product.name} on the store`}
        >
          {/* Reserved 3:4 box prevents layout shift (CLS) */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              crossOrigin="anonymous"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
            />
            <img
              src={product.hoverImage}
              alt=""
              aria-hidden
              loading="lazy"
              crossOrigin="anonymous"
              className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          </div>
        </a>

        <CardContent className="pb-3">
          <h3 className="font-display text-lg uppercase tracking-wide text-cream">
            {product.name}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-sans text-sm text-cream">
              {formatINR(product.price)}
            </span>
            {product.compareAt && (
              <span className="font-sans text-xs text-muted-foreground line-through">
                {formatINR(product.compareAt)}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <a
            href={product.url}
            rel="noopener"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
          >
            Add / View
          </a>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export function FeaturedProducts() {
  const prefersReduced = useReducedMotion()
  return (
    <section className="bg-ink px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 font-sans text-xs uppercase tracking-[0.4em] text-bronze">
            The Collection
          </p>
          <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none tracking-tight text-cream">
            Featured
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((product, i) => (
            <ProductCard key={product.name} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
