import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { formatINR } from '@/utils/cn'

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, updateCartQty, removeFromCart, cartTotal, clearCart } = useApp()

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart overlay"
            className="fixed inset-0 z-50 bg-[rgba(10,16,24,0.45)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="font-display text-2xl">Your cart</h2>
              </div>
              <button type="button" className="rounded-full border border-[var(--line)] p-2" onClick={() => setCartOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cart.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
                  Your cart is empty. Add products from search or the AI Lab.
                </div>
              )}
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 rounded-2xl border border-[var(--line)] p-3">
                  <img src={item.product.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{item.product.name}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{formatINR(item.product.price)}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-2 py-1">
                        <button type="button" onClick={() => updateCartQty(item.product.id, item.qty - 1)} aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-5 text-center text-sm font-semibold">{item.qty}</span>
                        <button type="button" onClick={() => updateCartQty(item.product.id, item.qty + 1)} aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.product.id)} className="text-[var(--muted)] hover:text-[var(--danger)]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--line)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Subtotal</span>
                <span className="font-display text-2xl">{formatINR(cartTotal)}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost flex-1" onClick={clearCart} disabled={!cart.length}>
                  Clear
                </button>
                <Link to="/cart" onClick={() => setCartOpen(false)} className="btn-primary flex-1">
                  View cart
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-[var(--muted)]">Demo cart only — no real checkout.</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
