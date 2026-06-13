import { Link } from 'react-router-dom'
import { useState } from 'react'
import { formatINR, cdnImg } from '../utils.js'

export default function ProductCard({ product }) {
  const [hover, setHover] = useState(false)
  const hasAlt = product.images.length > 1
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  return (
    <Link
      to={`/product/${product.handle}`}
      className="card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="card-media">
        {discount > 0 && <span className="card-badge">-{discount}%</span>}
        <img
          src={cdnImg(product.images[0], 600)}
          alt={product.title}
          className="card-img"
          style={{ opacity: hover && hasAlt ? 0 : 1 }}
          loading="lazy"
          decoding="async"
        />
        {hasAlt && hover && (
          <img
            src={cdnImg(product.images[1], 600)}
            alt=""
            aria-hidden="true"
            className="card-img card-img-alt"
            style={{ opacity: 1 }}
            loading="lazy"
            decoding="async"
          />
        )}
        <span className="card-cta">VIEW</span>
      </div>
      <div className="card-info">
        <h3 className="card-title">{product.title}</h3>
        <div className="card-price">
          <span className="price-now">{formatINR(product.price)}</span>
          {product.compareAtPrice && (
            <span className="price-was">{formatINR(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
