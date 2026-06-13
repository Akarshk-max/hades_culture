import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatINR, cdnImg, PREPAID_DISCOUNT } from '../utils.js'

export default function CartDrawer({ open, onClose }) {
  const { items, subtotal, setQty, removeItem } = useCart()
  const navigate = useNavigate()

  const prepaidTotal = Math.round(subtotal * (1 - PREPAID_DISCOUNT))

  function goCheckout() {
    onClose()
    navigate('/checkout')
  }

  return (
    <>
      <div
        className={`drawer-overlay ${open ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`drawer ${open ? 'open' : ''}`} aria-label="Shopping bag">
        <div className="drawer-head">
          <h2>YOUR BAG ({items.length})</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>Your bag is empty.</p>
            <button className="btn btn-outline" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {items.map((i) => (
                <div className="line" key={i.key}>
                  <img src={cdnImg(i.image, 200)} alt={i.title} className="line-img" />
                  <div className="line-info">
                    <div className="line-top">
                      <span className="line-title">{i.title}</span>
                      <button
                        className="line-remove"
                        onClick={() => removeItem(i.key)}
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="line-size">Size: {i.size}</span>
                    <div className="line-bottom">
                      <div className="qty">
                        <button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Decrease">−</button>
                        <span>{i.qty}</span>
                        <button onClick={() => setQty(i.key, i.qty + 1)} aria-label="Increase">+</button>
                      </div>
                      <span className="line-price">{formatINR(i.price * i.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-foot">
              <div className="foot-row">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="foot-row foot-prepaid">
                <span>Prepaid price (−25%)</span>
                <span>{formatINR(prepaidTotal)}</span>
              </div>
              <button className="btn btn-solid btn-block" onClick={goCheckout}>
                CHECKOUT · {formatINR(prepaidTotal)}
              </button>
              <button className="btn-link" onClick={onClose}>
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
