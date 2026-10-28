import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, BrainCircuit, Layers3, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/products/ProductCard'
import { SearchBar } from '@/components/search/SearchBar'
import { api } from '@/services/api'

const examples = [
  'wireless headphones for gym under ₹5000',
  'comfortable running shoes for beginners',
  'lightweight laptop for programming',
  'skincare products for oily skin',
]

export function HomePage() {
  const products = useQuery({
    queryKey: ['featured'],
    queryFn: () => api.listProducts({ page_size: 8 }),
  })
  const catalog = useQuery({
    queryKey: ['catalog-meta'],
    queryFn: () => api.listProducts({ page_size: 1 }),
  })

  return (
    <div>
      {/* Hero — matches mockup layout */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 md:px-6 md:pb-14 md:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-[2.75rem] leading-[1.05] text-[var(--fg)] md:text-[3.75rem] lg:text-[4.25rem]"
            >
              Search that understands what you{' '}
              <span className="highlight-gold">actually</span> want.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--muted)] md:text-base"
            >
              Semantic relevance meets multi-task personalization across a{' '}
              {catalog.data?.total ?? 120}+ product demo catalog — ranked for click, add-to-cart, and purchase.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="mt-8"
            >
              <SearchBar large />
            </motion.div>
            <div className="mt-4 flex flex-wrap gap-2">
              {examples.map((q) => (
                <Link
                  key={q}
                  to={`/search?q=${encodeURIComponent(q)}`}
                  className="rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--fg)] dark:bg-[var(--card)]"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 }}
            className="relative min-h-[380px] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-lg)] md:min-h-[460px]"
          >
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80"
              alt="Curated retail"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f44]/90 via-[#0a1f44]/25 to-transparent" />
            <div className="absolute bottom-0 p-7 text-white md:p-8">
              <p className="font-display text-2xl leading-tight md:text-3xl">
                Personalized ranking, not just keyword match.
              </p>
              <p className="mt-2 max-w-sm text-sm text-white/75">
                TinyBERT-style encoding · semantic similarity · structured features · MMoE multi-task scoring.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="feature-strip grid gap-0 md:grid-cols-3">
          {[
            {
              icon: BrainCircuit,
              tone: 'var(--icon-purple)',
              title: 'TinyBERT Semantic Matching',
              body: 'Query and product text are embedded and compared with element-wise interaction features.',
            },
            {
              icon: Layers3,
              tone: 'var(--icon-blue)',
              title: 'MMoE Multi-Task Learning',
              body: 'Click, ATC, and purchase signals are modeled together instead of optimizing a single action.',
            },
            {
              icon: Users,
              tone: 'var(--icon-tan)',
              title: 'Personalization Degree',
              body: 'Compare rankings with and without user features to see how preferences reshuffle results.',
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className={`flex gap-4 p-6 md:p-7 ${i < 2 ? 'md:border-r md:border-[var(--line)]' : ''}`}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ background: item.tone }}
              >
                <item.icon className="h-5 w-5 text-[var(--fg)]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[var(--fg)]">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">Catalog</p>
            <h2 className="mt-1 font-display text-3xl text-[var(--fg)] md:text-4xl">Featured products</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {catalog.data?.total ?? 120} indexed demo products across beauty, tech, sport, and home
            </p>
          </div>
          <Link
            to="/search?q=trending%20products"
            className="hidden items-center gap-1 text-sm font-semibold text-[var(--accent)] sm:inline-flex"
          >
            Explore search <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {products.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-[360px]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.data?.items.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
