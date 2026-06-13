export default function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer-grid">
        <div className="footer-col footer-brand">
          <div className="brand brand-footer">HADES<span>CULTURE</span></div>
          <p>
            Contemporary streetwear forged in shadow. Built for those who move
            through the underworld and rise again. Rebirth SS26.
          </p>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <a href="#shop">All Products</a>
          <a href="#shop">Rebirth SS26</a>
          <a href="#shop">Outerwear</a>
          <a href="#shop">Tees</a>
        </div>
        <div className="footer-col">
          <h4>Help</h4>
          <a href="#">Shipping</a>
          <a href="#">Returns</a>
          <a href="#">Size Guide</a>
          <a href="#">Contact</a>
        </div>
        <div className="footer-col">
          <h4>Newsletter</h4>
          <p>Join the cult. Early drops & secret releases.</p>
          <form className="newsletter" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="your@email.com" aria-label="Email" />
            <button type="submit">→</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Hades Culture · Enhanced demo build</span>
        <span>Made with intent · Not affiliated with the original store</span>
      </div>
    </footer>
  )
}
