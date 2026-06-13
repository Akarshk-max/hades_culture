// Real Hades Culture assets (scraped from hadesculture.store). All buy actions
// deep-link out to the live Shopify store — no cart logic lives here.

const CDN = 'https://hadesculture.store/cdn/shop/files'
const img = (file: string, width = 1200) => `${CDN}/${file}?width=${width}`

export const SHOP_BASE = 'https://hadesculture.store'
export const SHOP_ALL = `${SHOP_BASE}/collections/all`
export const SHOP_REBIRTH = `${SHOP_BASE}/collections/rebirth-ss26`
export const INSTAGRAM = 'https://www.instagram.com/hadesculture.store'

/* ── Section 2 video montage ──────────────────────────────────────────────
 * Drop your clips in /public/media/clips/ named clip01.mp4, clip02.mp4, …
 * Then set MONTAGE_CLIP_COUNT to how many you have. Missing files are skipped
 * gracefully, so an off-by-one count won't break the montage. */
export const MONTAGE_CLIP_COUNT = 7
export const MONTAGE_CLIPS = Array.from(
  { length: MONTAGE_CLIP_COUNT },
  (_, i) => `/media/clips/clip${String(i + 1).padStart(2, '0')}.mp4`
)
/** Poster frame shown before clips load / when reduced-motion is on. */
export const MONTAGE_POSTER = '/media/clips/poster.jpg'

/** Images for the 3D "THE DROP" gallery — the brand's real shoot. */
export const GALLERY_IMAGES = [
  { file: 'DSC03300_28d44e33-a52b-4bec-b505-2f060cfae71f.jpg', alt: 'Muse Brown' },
  { file: 'DSC03274_c6682629-83bf-4ae0-af5a-7b6bb6e42ab4.jpg', alt: 'Muse Brown' },
  { file: 'DSC03236_7d3070e7-f41c-4bd8-bc65-ded99c05e8a3.jpg', alt: 'Muse Black' },
  { file: 'DSC03213_02bf3f64-adeb-496e-9e06-c1bea8bee795.jpg', alt: 'Red Havoc Jacket' },
  { file: 'DSC03358_69d6ad3c-ee68-44fa-a09b-8974e43f06e8.jpg', alt: 'Relic Vest' },
  { file: 'DSC03445_5e624bb4-e172-4df9-963e-856456717e10.jpg', alt: 'Melt Waffle' },
  { file: 'DSC03401_48576c86-2c36-4d91-b20a-b70b76770d1d.jpg', alt: 'Flux Waffle' },
  { file: 'DSC03519_92c9a513-b2e4-4e4f-b6e5-2d12d4bdc814.jpg', alt: 'Cipher Tee' },
  { file: 'DSC03345_c16a1271-a34b-43a6-b61c-a94924b1115f.jpg', alt: 'HC Blank' },
  { file: 'DSC03154_035c0cab-a70d-4d76-90d7-7363df1040fa.jpg', alt: 'Bronze Ace' },
].map((g) => ({ src: img(g.file, 1200), alt: g.alt }))

/** A dramatic shot used as the hero's fallback background before/without video. */
export const HERO_FALLBACK = img(
  'DSC03213_02bf3f64-adeb-496e-9e06-c1bea8bee795.jpg',
  1600
)

export interface FeaturedProduct {
  name: string
  price: number
  compareAt?: number
  image: string
  hoverImage: string
  url: string
}

export const FEATURED: FeaturedProduct[] = [
  {
    name: 'Red Havoc Jacket',
    price: 3199,
    compareAt: 4483,
    image: img('DSC03213_02bf3f64-adeb-496e-9e06-c1bea8bee795.jpg', 800),
    hoverImage: img('DSC03186_e41cc604-11e5-4263-92fc-f3351cb06f2e.jpg', 800),
    url: `${SHOP_BASE}/products/untitled-nov13_13-04`,
  },
  {
    name: 'Bronze Ace',
    price: 5499,
    compareAt: 6369,
    image: img('DSC03154_035c0cab-a70d-4d76-90d7-7363df1040fa.jpg', 800),
    hoverImage: img('DSC03144_cf07c7c1-afae-4f4c-94c8-ffd90e72bc73.jpg', 800),
    url: `${SHOP_BASE}/products/bronze-ace`,
  },
  {
    name: 'Relic Vest',
    price: 1062,
    compareAt: 1381,
    image: img('DSC03358_69d6ad3c-ee68-44fa-a09b-8974e43f06e8.jpg', 800),
    hoverImage: img('DSC03361_13ab9cf5-9937-4551-8af8-3be6badabd45.jpg', 800),
    url: `${SHOP_BASE}/products/relic-vest`,
  },
  {
    name: 'Muse Brown',
    price: 1499,
    compareAt: 1948,
    image: img('DSC03300_28d44e33-a52b-4bec-b505-2f060cfae71f.jpg', 800),
    hoverImage: img('DSC03274_c6682629-83bf-4ae0-af5a-7b6bb6e42ab4.jpg', 800),
    url: `${SHOP_BASE}/products/muse-brown-rib-tee`,
  },
  {
    name: 'Muse Black',
    price: 1499,
    compareAt: 1948,
    image: img('DSC03236_7d3070e7-f41c-4bd8-bc65-ded99c05e8a3.jpg', 800),
    hoverImage: img('DSC03240_c63de0ef-d79f-4c81-aba1-2d4717ea5e3f.jpg', 800),
    url: `${SHOP_BASE}/products/muse-black-rib-tee`,
  },
  {
    name: 'Cipher Tee',
    price: 1299,
    compareAt: 2499,
    image: img('DSC03519_92c9a513-b2e4-4e4f-b6e5-2d12d4bdc814.jpg', 800),
    hoverImage: img('DSC03523_0a116d45-1cb3-4fe1-a9e0-9c949630b1bc.jpg', 800),
    url: `${SHOP_BASE}/products/consequence-tee`,
  },
]

export const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
