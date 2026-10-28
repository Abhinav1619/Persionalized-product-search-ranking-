import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/products/ProductCard'
import { RankingDetails } from '@/components/ranking/RankingDetails'
import { SearchBar } from '@/components/search/SearchBar'
import { useApp } from '@/context/AppContext'
import { api } from '@/services/api'
import type { RankingMode } from '@/types'
import { cn } from '@/utils/cn'

const modes: { id: RankingMode; label: string }[] = [
  { id: 'personalized', label: 'Personalized' },
  { id: 'relevance', label: 'Relevance only' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'rating', label: 'Customer rating' },
  { id: 'popularity', label: 'Popularity' },
]

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || 'wireless headphones for gym under ₹5000'
  const { userId } = useApp()

  const [mode, setMode] = useState<RankingMode>('personalized')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState('')
  const [showAI, setShowAI] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const search = useQuery({
    queryKey: ['search', query, userId, mode, category, brand, minPrice, maxPrice, minRating],
    queryFn: () =>
      api.search({
        query,
        user_id: userId,
        ranking_mode: mode,
        filters: {
          category: category || undefined,
          brand: brand || undefined,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          min_rating: minRating ? Number(minRating) : undefined,
        },
        page_size: 36,
      }),
  })

  const selected = useMemo(
    () => search.data?.results.find((r) => r.product.id === selectedId) || search.data?.results[0],
    [search.data, selectedId],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="section-eyebrow">Ranked catalog</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">Search results</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {search.data
              ? `${search.data.total} products · ${search.data.scoring_method}`
              : 'Loading ranked products…'}
          </p>
          {search.data?.intent?.max_price != null && (
            <p className="mt-2 inline-flex rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white dark:text-[#101820]">
              Budget filter active · max ₹{search.data.intent.max_price.toLocaleString('en-IN')}
            </p>
          )}
        </div>
        <SearchBar
          initialQuery={query}
          onSubmitQuery={(q) => setParams({ q })}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm',
              mode === m.id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]',
            )}
          >
            {m.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAI((v) => !v)}
          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm"
        >
          {showAI ? 'Hide' : 'Show'} AI Ranking Details
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="card-surface h-fit space-y-4 p-4">
          <h2 className="text-sm font-semibold">Filters</h2>
          <label className="block text-xs text-[var(--muted)]">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-2 text-sm"
            >
              <option value="">All</option>
              {(search.data?.facets.categories || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[var(--muted)]">
            Brand
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-2 text-sm"
            >
              <option value="">All</option>
              {(search.data?.facets.brands || []).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-[var(--muted)]">
              Min ₹
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-[var(--muted)]">
              Max ₹
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-xs text-[var(--muted)]">
            Min rating
            <input
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              placeholder="4.0"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-2 text-sm"
            />
          </label>
        </aside>

        <div className={cn('grid gap-4', showAI ? 'xl:grid-cols-[1fr_300px]' : '')}>
          <div>
            {search.isLoading && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-80" />
                ))}
              </div>
            )}
            {search.isError && (
              <div className="card-surface p-6 text-sm text-red-700">
                Could not load search results. Is the backend running at the configured API URL?
              </div>
            )}
            {search.data && search.data.results.length === 0 && (
              <div className="card-surface p-8 text-center text-[var(--muted)]">
                No products matched these filters. Try broadening your search.
              </div>
            )}
            {search.data && search.data.results.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {search.data.results.map((item) => (
                  <div key={item.product.id} onMouseEnter={() => setSelectedId(item.product.id)}>
                    <ProductCard
                      product={item.product}
                      explanation={item.explanation}
                      rank={item.rank}
                      showWhy
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {showAI && selected?.explanation && <RankingDetails explanation={selected.explanation} />}
        </div>
      </div>
    </div>
  )
}
