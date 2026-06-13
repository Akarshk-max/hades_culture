export function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN')
}

// Shopify's CDN can resize images on the fly via a ?width= param. The scraped
// URLs point at full-res originals (often 2000px+), which is why pages felt slow.
// Request a sensible width for the context instead.
export function cdnImg(src, width = 600) {
  if (!src || typeof src !== 'string') return src
  if (!src.includes('cdn.shopify.com')) return src
  const sep = src.includes('?') ? '&' : '?'
  return `${src}${sep}width=${width}`
}

// 25% off on prepaid (UPI) orders — matches the live store's offer
export const PREPAID_DISCOUNT = 0.25
