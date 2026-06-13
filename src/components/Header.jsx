import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function Header({ onCartClick }) {
  const { count } = useCart()

  return (
    <>
      <div className="announcement">
        25% OFF ON PREPAID ORDERS · FREE SHIPPING ACROSS INDIA · REBIRTH SS26
      </div>
      <header className="header">
        <nav className="nav">
          <div className="nav-left">
            <Link to="/shop" className="nav-link">Shop</Link>
            <Link to="/" className="nav-link">Home</Link>
          </div>
          <Link to="/" className="brand">
            HADES<span>CULTURE</span>
          </Link>
          <div className="nav-right">
            <button className="icon-btn" aria-label="Search">⌕</button>
            <button className="icon-btn cart-btn" aria-label="Cart" onClick={onCartClick}>
              BAG
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
          </div>
        </nav>
      </header>
    </>
  )
}
