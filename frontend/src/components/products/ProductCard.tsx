import { Heart, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product, RankingExplanation } from '@/types'
import { useApp } from '@/context/AppContext'
import { api } from '@/services/api'
import { cn, formatINR } from '@/utils/cn'

interface Props {
  product: Product
  explanation?: RankingExplanation | null
  rank?: number
  showWhy?: boolean
}

export function ProductCard({ product, explanation, rank, showWhy }: Props) {
  const { addToCart, toggleWishlist, wishlist, userId } = useApp()
  const wished = wishlist.some((w) => w.id === product.id)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <div className="relative">
        <Link to={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#f3f0ea]">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'
            }}
          />
          {typeof rank === 'number' && (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-white">
              #{rank}
            </span>
          )}
          {product.discount_percent ? (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--warm)] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{Math.round(product.discount_percent)}%
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          aria-label="Wishlist"
          onClick={async () => {
            toggleWishlist(product)
            await api.postEvent({ event_type: 'wishlist', user_id: userId, product_id: product.id })
          }}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105',
            wished && 'text-red-500',
          )}
        >
          <Heart className={cn('h-4 w-4', wished && 'fill-current')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          {product.brand} · {product.category}
        </p>
        <Link to={`/products/${product.id}`} className="block text-[15px] font-bold leading-snug text-[var(--fg)] hover:underline">
          {product.name}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-[var(--fg)]">{formatINR(product.price)}</span>
          {product.original_price ? (
            <span className="text-sm text-[var(--muted)] line-through">{formatINR(product.original_price)}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <Star className="h-3.5 w-3.5 fill-[#f5b942] text-[#f5b942]" />
          <span className="font-semibold text-[var(--fg)]">{product.rating.toFixed(1)}</span>
          <span className="text-[var(--muted)]">
            ({product.review_count >= 1000 ? `${(product.review_count / 1000).toFixed(1)}k` : product.review_count})
          </span>
        </div>

        {showWhy && explanation ? (
          <p className="rounded-xl bg-[var(--bg)] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
            <span className="font-bold text-[var(--fg)]">Why this result: </span>
            {explanation.why_this_result}
          </p>
        ) : null}

        <button
          type="button"
          onClick={async () => {
            addToCart(product)
            await api.postEvent({ event_type: 'atc', user_id: userId, product_id: product.id })
          }}
          className="btn-primary mt-auto w-full !rounded-full !py-2.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
        >
          <ShoppingBag className="h-4 w-4" /> Add to cart
        </button>
      </div>
    </article>
  )
}
