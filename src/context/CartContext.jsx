import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'hades_cart_v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { items: [] }
  } catch {
    return { items: [] }
  }
}

// Each item is uniquely keyed by productId + size
function lineKey(productId, size) {
  return `${productId}::${size}`
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, size, qty } = action
      const key = lineKey(product.id, size)
      const existing = state.items.find((i) => i.key === key)
      let items
      if (existing) {
        items = state.items.map((i) =>
          i.key === key ? { ...i, qty: i.qty + qty } : i
        )
      } else {
        items = [
          ...state.items,
          {
            key,
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images[0],
            size,
            qty,
          },
        ]
      }
      return { ...state, items }
    }
    case 'SET_QTY': {
      const items = state.items
        .map((i) => (i.key === action.key ? { ...i, qty: action.qty } : i))
        .filter((i) => i.qty > 0)
      return { ...state, items }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.key !== action.key) }
    case 'CLEAR':
      return { ...state, items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota errors */
    }
  }, [state])

  const value = useMemo(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0)
    const subtotal = state.items.reduce((n, i) => n + i.qty * i.price, 0)
    return {
      items: state.items,
      count,
      subtotal,
      addItem: (product, size, qty = 1) =>
        dispatch({ type: 'ADD', product, size, qty }),
      setQty: (key, qty) => dispatch({ type: 'SET_QTY', key, qty }),
      removeItem: (key) => dispatch({ type: 'REMOVE', key }),
      clear: () => dispatch({ type: 'CLEAR' }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
