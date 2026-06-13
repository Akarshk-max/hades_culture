import { useMemo, useState } from 'react'
import products from '../data/products.js'
import ProductCard from '../components/ProductCard.jsx'
import AnimatedHero from '../components/AnimatedHero.jsx'
import ImmersiveGallery from '../components/ImmersiveGallery.jsx'

const SORTS = {
  featured: { label: 'Featured', fn: null },
  'price-asc': { label: 'Price: Low to High', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: High to Low', fn: (a, b) => b.price - a.price },
  'name': { label: 'A–Z', fn: (a, b) => a.title.localeCompare(b.title) },
}

export default function Home() {
  const [sort, setSort] = useState('featured')
  const [query, setQuery] = useState('')

  const shown = useMemo(() => {
    let list = products.filter((p) =>
      p.title.toLowerCase().includes(query.toLowerCase())
    )
    const fn = SORTS[sort].fn
    if (fn) list = [...list].sort(fn)
    return list
  }, [sort, query])

  return (
    <>
      <AnimatedHero />

      <section className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              REBIRTH SS26 ✶ 25% OFF PREPAID ✶ FREE SHIPPING ✶ LIMITED STOCK ✶ HADES CULTURE ✶&nbsp;
            </span>
          ))}
        </div>
      </section>

      <ImmersiveGallery />

      <section className="shop" id="shop">
        <div className="shop-head">
          <div>
            <h2 className="section-title">ALL PRODUCTS</h2>
            <span className="section-count">{shown.length} pieces</span>
          </div>
          <div className="shop-controls">
            <input
              className="search-input"
              placeholder="Search drops…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="empty-state">No drops match “{query}”.</p>
        ) : (
          <div className="grid">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
