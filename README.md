# Hades Culture — Enhanced

An enhanced, fully interactive rebuild of [hadesculture.store](https://hadesculture.store/),
built with **React + Vite**. Real product data (titles, prices, sizes, images) is scraped
from the live Shopify store. Includes a working cart and a **UPI checkout** flow.

## Features

- 🛍️ **Real products** — 9 live products with all images, sizes (S–XXL) and prices
- 🎨 **Modern monochrome streetwear UI** — animated hero, hover-swap product cards, marquee
- 🌀 **Immersive 3D gallery** — WebGL infinite-depth gallery of your real product photos
  (scroll / arrow keys / drag to navigate, auto-plays). Lazy-loaded so it never slows the
  initial page. Adapted from a 21st.dev component into this stack.
- 🔎 **Search & sort** on the shop page
- 🛒 **Interactive cart** — add to bag, size selection, quantity, remove, persists in `localStorage`
- 💸 **UPI checkout** — generates a real UPI intent link + scannable QR code for the order total
  (works with GPay / PhonePe / Paytm), applies the store's 25% prepaid discount
- 📱 **Fully responsive** — desktop, tablet, mobile

## Run it

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** (it opens automatically).

To build for production:

```bash
npm run build
npm run preview
```

## How to try the flow

1. Click any product → pick a size → **Add to Bag**
2. Open the bag (top-right **BAG**) → **Checkout**
3. Fill shipping details → **Continue to Payment**
4. Scan the **UPI QR** or tap **Open UPI app** on a phone → **I've completed the payment**

## Configure the merchant UPI ID

Edit `src/config.js` and set your real UPI ID:

```js
export const UPI_ID = 'yourname@oksbi'      // ← your VPA
export const UPI_PAYEE_NAME = 'Hades Culture'
```

The current value (`hadesculture@upi`) is a placeholder for the demo.

## Project structure

```
src/
  config.js              # UPI merchant settings
  utils.js               # currency + discount helpers
  data/products.js       # real scraped product data
  context/CartContext.jsx# cart state + localStorage
  components/            # Header, Footer, ProductCard, CartDrawer, ScrollToTop
  pages/                 # Home, Product, Checkout
```

## Notes

- This is an independent demo build for enhancement purposes — **not affiliated with the
  original store**. Product images are hot-linked from the live Shopify CDN.
- The UPI flow generates a valid payment request; actual settlement requires a real,
  active UPI ID. There is no backend — orders are confirmed client-side for the demo.

## Roadmap (incremental)

Next features we can layer on:
- Wishlist / favorites
- Product filters (by type, price range)
- Quick-view modal from the grid
- Dark/light theme toggle
- Real order persistence + email confirmation (needs a backend)
- Payment gateway (Razorpay/Cashfree) for live UPI settlement
