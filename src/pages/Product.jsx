import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import products from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { formatINR, cdnImg } from '../utils.js'
import ProductCard from '../components/ProductCard.jsx'

export default function Product({ onAdded }) {
  const { handle } = useParams()
  const product = products.find((p) => p.handle === handle)
  const { addItem } = useCart()

  const [activeImg, setActiveImg] = useState(0)
  const [size, setSize] = useState(null)
  const [error, setError] = useState('')

  if (!product) {
    return (
      <div className="not-found">
        <h2>Drop not found</h2>
        <Link to="/shop" className="btn btn-outline">Back to shop</Link>
      </div>
    )
  }

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const related = products.filter((p) => p.id !== product.id).slice(0, 4)

  function handleAdd() {
    if (!size) {
      setError('Please select a size')
      return
    }
    setError('')
    addItem(product, size, 1)
    onAdded?.()
  }

  return (
    <>
      <div className="breadcrumb">
        <Link to="/shop">Shop</Link> / <span>{product.title}</span>
      </div>

      <div className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-main">
            <img src={cdnImg(product.images[activeImg], 1000)} alt={product.title} />
          </div>
          <div className="pdp-thumbs">
            {product.images.map((src, i) => (
              <button
                key={i}
                className={`thumb ${i === activeImg ? 'active' : ''}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={cdnImg(src, 160)} alt={`${product.title} ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="pdp-info">
          <span className="pdp-type">{product.type || 'Apparel'}</span>
          <h1 className="pdp-title">{product.title}</h1>
          <div className="pdp-price">
            <span className="price-now">{formatINR(product.price)}</span>
            {product.compareAtPrice && (
              <>
                <span className="price-was">{formatINR(product.compareAtPrice)}</span>
                <span className="pdp-save">SAVE {discount}%</span>
              </>
            )}
          </div>
          <p className="pdp-tax">Inclusive of all taxes · 25% extra off on prepaid</p>

          <div className="pdp-sizes">
            <div className="pdp-sizes-head">
              <span>SELECT SIZE</span>
              <a href="#" onClick={(e) => e.preventDefault()}>Size guide</a>
            </div>
            <div className="size-row">
              {product.sizes.map((s) => (
                <button
                  key={s.size}
                  className={`size-btn ${size === s.size ? 'active' : ''} ${!s.available ? 'disabled' : ''}`}
                  disabled={!s.available}
                  onClick={() => { setSize(s.size); setError('') }}
                >
                  {s.size}
                </button>
              ))}
            </div>
            {error && <span className="size-error">{error}</span>}
          </div>

          <button className="btn btn-solid btn-block pdp-add" onClick={handleAdd}>
            ADD TO BAG
          </button>

          <div className="pdp-desc">
            <h3>DETAILS</h3>
            <p>{product.description || 'Crafted for the culture. Premium construction, built to last.'}</p>
          </div>

          <ul className="pdp-perks">
            <li>✶ Free shipping across India</li>
            <li>✶ 25% off on prepaid (UPI) orders</li>
            <li>✶ Easy 7-day returns</li>
          </ul>
        </div>
      </div>

      <section className="related">
        <h2 className="section-title">YOU MAY ALSO LIKE</h2>
        <div className="grid">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  )
}
