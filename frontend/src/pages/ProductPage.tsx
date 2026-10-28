import { useQuery } from '@tanstack/react-query'
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ProductCard } from '@/components/products/ProductCard'
import { useApp } from '@/context/AppContext'
import { api } from '@/services/api'
import { formatINR } from '@/utils/cn'

export function ProductPage() {
  const { id = '' } = useParams()
  const { addToCart, toggleWishlist, userId } = useApp()
  const q = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    enabled: !!id,
  })

  useEffect(() => {
    if (id) {
      void api.postEvent({ event_type: 'impression', user_id: userId, product_id: id })
    }
  }, [id, userId])

  if (q.isLoading) return <div className="mx-auto max-w-7xl px-4 py-10"><div className="skeleton h-96" /></div>
  if (q.isError || !q.data) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-[var(--muted)]">Product not found.</div>
  }

  const { product, similar_products, related_search_terms, why_recommend } = q.data

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)]">
          <img
            src={product.image_url}
            alt={product.name}
            className="aspect-square w-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
            }}
          />
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-[var(--muted)]">
            {product.brand} · {product.category}
          </p>
          <h1 className="mt-2 font-display text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)} · {product.review_count.toLocaleString('en-IN')} reviews
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{formatINR(product.price)}</span>
            {product.original_price ? (
              <span className="text-[var(--muted)] line-through">{formatINR(product.original_price)}</span>
            ) : null}
          </div>
          <p className="mt-5 leading-relaxed text-[var(--muted)]">{product.description}</p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                <div className="text-xs text-[var(--muted)]">{k}</div>
                <div className="font-medium">{String(v)}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                addToCart(product)
                await api.postEvent({ event_type: 'atc', user_id: userId, product_id: product.id })
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </button>
            <button
              type="button"
              onClick={async () => {
                toggleWishlist(product)
                await api.postEvent({ event_type: 'wishlist', user_id: userId, product_id: product.id })
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-2.5 text-sm"
            >
              <Heart className="h-4 w-4" /> Wishlist
            </button>
            <button
              type="button"
              onClick={async () => {
                await api.postEvent({ event_type: 'purchase', user_id: userId, product_id: product.id })
                await api.postEvent({ event_type: 'click', user_id: userId, product_id: product.id })
              }}
              className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm"
            >
              Record demo purchase
            </button>
          </div>

          <div className="card-surface mt-6 p-4 text-sm">
            <h3 className="font-semibold">Why we recommend this</h3>
            <p className="mt-2 text-[var(--muted)]">{why_recommend}</p>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Interaction buttons record simulated demo events only — not real transactions.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {related_search_terms.map((t) => (
              <Link
                key={t}
                to={`/search?q=${encodeURIComponent(t)}`}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Similar products</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {similar_products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
