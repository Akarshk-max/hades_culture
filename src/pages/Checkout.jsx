import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { useCart } from '../context/CartContext.jsx'
import { formatINR, cdnImg, PREPAID_DISCOUNT } from '../utils.js'
import { UPI_ID, UPI_PAYEE_NAME } from '../config.js'

function buildUpiUri({ amount, note }) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  })
  return `upi://pay?${params.toString()}`
}

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState('details') // details → pay → done
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', pincode: '' })
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [orderId] = useState(() => 'HC' + Date.now().toString().slice(-8))

  const prepaidTotal = Math.round(subtotal * (1 - PREPAID_DISCOUNT))
  const savings = subtotal - prepaidTotal

  const upiUri = useMemo(
    () => buildUpiUri({ amount: prepaidTotal, note: `Hades Culture Order ${orderId}` }),
    [prepaidTotal, orderId]
  )

  useEffect(() => {
    if (step !== 'pay') return
    QRCode.toDataURL(upiUri, { width: 260, margin: 1, color: { dark: '#0a0a0a', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [step, upiUri])

  if (items.length === 0 && step !== 'done') {
    return (
      <div className="checkout-empty">
        <h2>Your bag is empty</h2>
        <Link to="/shop" className="btn btn-solid">Back to shop</Link>
      </div>
    )
  }

  function submitDetails(e) {
    e.preventDefault()
    setStep('pay')
  }

  function confirmPaid() {
    setStep('done')
    clear()
  }

  const valid =
    form.name && form.email && form.phone.length >= 10 && form.address && form.city && form.pincode.length >= 6

  // ── Order complete ──
  if (step === 'done') {
    return (
      <div className="order-done">
        <div className="done-mark">✓</div>
        <h1>ORDER CONFIRMED</h1>
        <p className="done-id">Order ID: <strong>{orderId}</strong></p>
        <p className="done-msg">
          Thanks, {form.name.split(' ')[0] || 'friend'}. We’ve received your prepaid order.
          A confirmation will be sent to <strong>{form.email}</strong>.
        </p>
        <p className="done-amount">Paid: {formatINR(prepaidTotal)}</p>
        <button className="btn btn-solid" onClick={() => navigate('/shop')}>
          CONTINUE SHOPPING
        </button>
      </div>
    )
  }

  return (
    <div className="checkout">
      <div className="checkout-main">
        <div className="checkout-steps">
          <span className={step === 'details' ? 'on' : 'done'}>1 · Details</span>
          <span className={step === 'pay' ? 'on' : ''}>2 · UPI Payment</span>
        </div>

        {step === 'details' && (
          <form className="checkout-form" onSubmit={submitDetails}>
            <h2 className="section-title">SHIPPING DETAILS</h2>
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label>Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} maxLength={10} required />
              </div>
            </div>
            <div className="field">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="field-row">
              <div className="field">
                <label>City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div className="field">
                <label>Pincode</label>
                <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} maxLength={6} required />
              </div>
            </div>
            <button className="btn btn-solid btn-block" type="submit" disabled={!valid}>
              CONTINUE TO PAYMENT
            </button>
          </form>
        )}

        {step === 'pay' && (
          <div className="upi-pay">
            <h2 className="section-title">PAY WITH UPI</h2>
            <p className="upi-intro">
              Scan the QR with any UPI app (GPay, PhonePe, Paytm) or tap the button on mobile.
            </p>

            <div className="upi-card">
              <div className="upi-qr">
                {qrDataUrl ? <img src={qrDataUrl} alt="UPI QR code" /> : <div className="qr-loading">Generating…</div>}
              </div>
              <div className="upi-meta">
                <div className="upi-row"><span>Pay to</span><strong>{UPI_PAYEE_NAME}</strong></div>
                <div className="upi-row"><span>UPI ID</span><strong>{UPI_ID}</strong></div>
                <div className="upi-row"><span>Amount</span><strong>{formatINR(prepaidTotal)}</strong></div>
                <div className="upi-row"><span>Order</span><strong>{orderId}</strong></div>
              </div>
            </div>

            <a className="btn btn-solid btn-block" href={upiUri}>
              OPEN UPI APP · PAY {formatINR(prepaidTotal)}
            </a>
            <p className="upi-hint">The button works on a phone with a UPI app installed.</p>

            <button className="btn btn-outline btn-block" onClick={confirmPaid}>
              I’VE COMPLETED THE PAYMENT
            </button>
            <button className="btn-link" onClick={() => setStep('details')}>← Back to details</button>
          </div>
        )}
      </div>

      <aside className="checkout-summary">
        <h3>ORDER SUMMARY</h3>
        <div className="summary-items">
          {items.map((i) => (
            <div className="summary-line" key={i.key}>
              <div className="summary-thumb">
                <img src={cdnImg(i.image, 150)} alt={i.title} />
                <span className="summary-qty">{i.qty}</span>
              </div>
              <div className="summary-info">
                <span>{i.title}</span>
                <small>Size {i.size}</small>
              </div>
              <span className="summary-price">{formatINR(i.price * i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="summary-totals">
          <div className="foot-row"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="foot-row foot-prepaid"><span>Prepaid discount (25%)</span><span>−{formatINR(savings)}</span></div>
          <div className="foot-row"><span>Shipping</span><span>FREE</span></div>
          <div className="foot-row foot-total"><span>Total</span><span>{formatINR(prepaidTotal)}</span></div>
        </div>
      </aside>
    </div>
  )
}
