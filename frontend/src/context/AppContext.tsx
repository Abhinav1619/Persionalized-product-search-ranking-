import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product, UserPreferences } from '@/types'

interface Toast {
  id: number
  message: string
  tone?: 'info' | 'success' | 'error'
}

export interface CartItem {
  product: Product
  qty: number
}

interface AppState {
  userId: string
  setUserId: (id: string) => void
  dark: boolean
  toggleDark: () => void
  cart: CartItem[]
  wishlist: Product[]
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (p: Product, qty?: number) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, qty: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  toggleWishlist: (p: Product) => void
  toasts: Toast[]
  pushToast: (message: string, tone?: Toast['tone']) => void
  preferences: UserPreferences | null
  setPreferences: (p: UserPreferences | null) => void
}

const AppContext = createContext<AppState | null>(null)

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('rw_cart_v2')
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function loadWishlist(): Product[] {
  try {
    const raw = localStorage.getItem('rw_wishlist')
    return raw ? (JSON.parse(raw) as Product[]) : []
  } catch {
    return []
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(() => localStorage.getItem('rw_user') || 'demo-fitness')
  const [dark, setDark] = useState(() => localStorage.getItem('rw_theme') === 'dark')
  const [cart, setCart] = useState<CartItem[]>(loadCart)
  const [wishlist, setWishlist] = useState<Product[]>(loadWishlist)
  const [cartOpen, setCartOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  useEffect(() => {
    localStorage.setItem('rw_user', userId)
  }, [userId])

  useEffect(() => {
    localStorage.setItem('rw_theme', dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    localStorage.setItem('rw_cart_v2', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('rw_wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  const pushToast = (message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }

  const cartCount = cart.reduce((n, i) => n + i.qty, 0)
  const cartTotal = cart.reduce((n, i) => n + i.product.price * i.qty, 0)

  const value = useMemo<AppState>(
    () => ({
      userId,
      setUserId,
      dark,
      toggleDark: () => setDark((d) => !d),
      cart,
      wishlist,
      cartOpen,
      setCartOpen,
      addToCart: (p, qty = 1) => {
        setCart((c) => {
          const existing = c.find((x) => x.product.id === p.id)
          if (existing) {
            return c.map((x) => (x.product.id === p.id ? { ...x, qty: x.qty + qty } : x))
          }
          return [...c, { product: p, qty }]
        })
        setCartOpen(true)
        pushToast(`${p.name} added to cart`, 'success')
      },
      removeFromCart: (productId) => {
        setCart((c) => c.filter((x) => x.product.id !== productId))
        pushToast('Removed from cart', 'info')
      },
      updateCartQty: (productId, qty) => {
        setCart((c) =>
          c
            .map((x) => (x.product.id === productId ? { ...x, qty } : x))
            .filter((x) => x.qty > 0),
        )
      },
      clearCart: () => setCart([]),
      cartCount,
      cartTotal,
      toggleWishlist: (p) => {
        setWishlist((w) => {
          const exists = w.some((x) => x.id === p.id)
          pushToast(exists ? 'Removed from wishlist' : 'Saved to wishlist', 'info')
          return exists ? w.filter((x) => x.id !== p.id) : [...w, p]
        })
      },
      toasts,
      pushToast,
      preferences,
      setPreferences,
    }),
    [userId, dark, cart, wishlist, cartOpen, toasts, preferences, cartCount, cartTotal],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
