import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { api } from '@/services/api'
import { formatINR } from '@/utils/cn'

export function CartPage() {
  const { cart, updateCartQty, removeFromCart, cartTotal, clearCart, userId, pushToast } = useApp()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <p className="section-eyebrow">Checkout preview</p>
      <h1 className="mt-2 font-display text-5xl">Shopping cart</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Quantities persist locally. Purchases are recorded as demo events only.</p>

      {cart.length === 0 ? (
        <div className="card-premium mt-8 p-10 text-center">
          <p className="text-[var(--muted)]">Your cart is empty.</p>
          <Link to="/search" className="btn-primary mt-5 inline-flex">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="card-premium flex flex-col gap-4 p-4 sm:flex-row">
                <img src={item.product.image_url} alt="" className="h-28 w-full rounded-2xl object-cover sm:h-28 sm:w-28" />
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${item.product.id}`} className="font-semibold hover:underline">
                    {item.product.name}
                  </Link>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {item.product.brand} · {formatINR(item.product.price)}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] px-3 py-1.5">
                      <button type="button" onClick={() => updateCartQty(item.product.id, item.qty - 1)}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-semibold">{item.qty}</span>
                      <button type="button" onClick={() => updateCartQty(item.product.id, item.qty + 1)}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatINR(item.product.price * item.qty)}</span>
                      <button type="button" onClick={() => removeFromCart(item.product.id)}>
                        <Trash2 className="h-4 w-4 text-[var(--muted)]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="card-premium h-fit p-6">
            <h2 className="font-display text-2xl">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Items</span>
                <span>{cart.reduce((n, i) => n + i.qty, 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatINR(cartTotal)}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary mt-6 w-full"
              onClick={async () => {
                for (const item of cart) {
                  await api.postEvent({
                    event_type: 'purchase',
                    user_id: userId,
                    product_id: item.product.id,
                    metadata: { qty: item.qty, demo: true },
                  })
                }
                clearCart()
                pushToast('Demo purchase recorded', 'success')
              }}
            >
              Complete demo purchase
            </button>
            <button type="button" className="btn-ghost mt-2 w-full" onClick={clearCart}>
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
