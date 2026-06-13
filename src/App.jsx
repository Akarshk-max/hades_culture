import { Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import Home from './pages/Home.jsx'
import Product from './pages/Product.jsx'
import Checkout from './pages/Checkout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Landing from './landing/Landing.tsx'

export default function App() {
  const [cartOpen, setCartOpen] = useState(false)
  const { pathname } = useLocation()

  // The cinematic landing page owns the full viewport — no shop chrome.
  if (pathname === '/') {
    return <Landing />
  }

  // Everything else is the existing demo storefront, with its header/cart/footer.
  return (
    <>
      <ScrollToTop />
      <Header onCartClick={() => setCartOpen(true)} />
      <main>
        <Routes>
          <Route path="/shop" element={<Home />} />
          <Route path="/product/:handle" element={<Product onAdded={() => setCartOpen(true)} />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
