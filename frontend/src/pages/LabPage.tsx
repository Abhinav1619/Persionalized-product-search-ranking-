import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRightLeft,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Cpu,
  Download,
  Filter,
  Heart,
  History,
  Layers,
  Link2,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { api } from '@/services/api'
import type { RankingMode } from '@/types'
import { cn, formatINR } from '@/utils/cn'

const SAMPLE_QUERIES = [
  'buds under 5k',
  'wireless headphones for gym under ₹5000',
  'lightweight laptop for programming',
  'skincare products for oily skin',
  'formal shoes for office wear',
]

type LabTab = 'results' | 'comparison' | 'pipeline' | 'features' | 'json'

function ScoreBar({ label, value, tone = 'accent' }: { label: string; value: number; tone?: 'accent' | 'warm' }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-[var(--muted)]">
        <span>{label}</span>
        <span className="font-semibold text-[var(--fg)]">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className={cn('h-full rounded-full', tone === 'warm' ? 'bg-[var(--warm)]' : 'bg-[var(--accent)]')}
        />
      </div>
    </div>
  )
}

export function LabPage() {
  const { addToCart, toggleWishlist, wishlist, userId: appUserId } = useApp()
  const qc = useQueryClient()
  const [query, setQuery] = useState('buds under 5k')
  const [userId, setUserId] = useState('demo-developer')
  const [mode, setMode] = useState<RankingMode>('personalized')
  const [tab, setTab] = useState<LabTab>('results')
  const [showDetails, setShowDetails] = useState(true)
  const [activeStage, setActiveStage] = useState(1)

  const users = useQuery({ queryKey: ['users'], queryFn: api.listUsers })
  const status = useQuery({ queryKey: ['model-status'], queryFn: api.modelStatus })
  const history = useQuery({ queryKey: ['lab-history'], queryFn: () => api.labHistory(12) })

  const run = useMutation({
    mutationFn: () =>
      api.rank({
        query,
        user_id: userId,
        ranking_mode: mode,
        personalization_enabled: mode === 'personalized',
      }),
    onSuccess: () => {
      setTab('results')
      setActiveStage(1)
      void qc.invalidateQueries({ queryKey: ['lab-history'] })
    },
  })

  const data = run.data
  const stages = data?.pipeline?.stages || []
  const active = stages.find((s) => s.id === activeStage) || stages[0]
  const topScore = data?.results[0]?.score ?? 0.83

  const productLookup = useMemo(() => {
    const byId = new Map<string, { name: string }>()
    data?.results.forEach((r) => byId.set(r.product.id, r.product))
    return byId
  }, [data])

  const tabs: { id: LabTab; label: string }[] = [
    { id: 'results', label: 'Results' },
    { id: 'comparison', label: 'Ranking Comparison' },
    { id: 'pipeline', label: 'Pipeline Visualization' },
    { id: 'features', label: 'Feature Contributions' },
    { id: 'json', label: 'JSON Output' },
  ]

  const exportJson = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rankwise-lab-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Hero */}
      <section className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="section-eyebrow">Interactive demonstration</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-[var(--fg)] md:text-5xl lg:text-[3.4rem]">
            AI Ranking <span className="lab-serif">Laboratory</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-[15px]">
            Ask naturally — e.g. “buds under 5k”. We parse budget + intent, filter the catalog, then rank only relevant
            products with TinyBERT-style matching and MMoE-inspired multi-task scoring. Every run is saved to JSON history.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: BrainCircuit, title: 'TinyBERT Semantic Matching', tone: 'var(--icon-purple)' },
              { icon: Layers, title: 'MMoE Multi-Task Learning', tone: 'var(--icon-blue)' },
              { icon: Filter, title: 'Constraint-aware Ranking', tone: 'var(--icon-tan)' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow)]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: f.tone }}>
                  <f.icon className="h-4 w-4 text-[var(--fg)]" />
                </div>
                <div className="text-sm font-bold leading-snug text-[var(--fg)]">{f.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline diagram card */}
        <div className="lab-diagram relative overflow-hidden rounded-[1.5rem] p-5 text-white shadow-[var(--shadow-lg)]">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12), transparent 35%)' }} />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              <span>Live architecture</span>
              <span className="rounded-full bg-white/10 px-2 py-1">MMoE</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[11px] text-white/70">Product embedding</div>
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"
                  alt=""
                  className="mt-2 h-16 w-full rounded-lg object-cover"
                />
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[11px] text-white/70">Query embedding</div>
                <div className="mt-2 rounded-lg bg-white/10 px-3 py-4 text-sm font-semibold">“{query || 'your query'}”</div>
              </div>
            </div>
            <div className="my-3 flex items-center justify-center gap-2 text-xs text-white/60">
              <Link2 className="h-3.5 w-3.5" /> fused into shared experts
            </div>
            <div className="rounded-xl bg-[#c5944e] px-4 py-3 text-center text-sm font-extrabold text-[#0a1f44]">
              MMoE · Click / ATC / Purchase towers
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded-lg bg-white/10 py-2">Click</div>
              <div className="rounded-lg bg-white/10 py-2">Add to Cart</div>
              <div className="rounded-lg bg-white/10 py-2">Purchase</div>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-white/15 pt-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-white/60">Final ranking score</div>
                <div className="font-display text-4xl">{topScore.toFixed(2)}</div>
              </div>
              <CheckCircle2 className="h-6 w-6 text-[#7ddea8]" />
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[var(--shadow)] md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Search query
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
              <Sparkles className="h-4 w-4 text-[var(--warm)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-[var(--fg)] outline-none"
                placeholder="buds under 5k"
              />
            </div>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Demo profile
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm font-semibold outline-none"
            >
              {(users.data || []).map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Ranking mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as RankingMode)}
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm font-semibold outline-none"
            >
              <option value="personalized">Personalized (MMoE)</option>
              <option value="relevance">Relevance only</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => run.mutate()}
              disabled={run.isPending}
              className="btn-primary w-full !rounded-2xl !px-6 !py-3.5"
            >
              <Sparkles className="h-4 w-4" />
              {run.isPending ? 'Running…' : 'Run Lab'}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuery(q)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                query === q
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white dark:text-[#0a1f44]'
                  : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]',
              )}
            >
              {q}
            </button>
          ))}
        </div>
        {data?.intent && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.intent.max_price != null && (
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white dark:text-[#0a1f44]">
                Budget ≤ ₹{data.intent.max_price.toLocaleString('en-IN')}
              </span>
            )}
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
              {data.filtered_count ?? data.results.length} matched products
            </span>
            {data.history_id && (
              <span className="rounded-full border border-[var(--warm)] px-3 py-1 text-xs font-semibold text-[var(--warm)]">
                Saved to JSON · {data.history_id.slice(0, 8)}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Main workspace */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* History */}
        <aside className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[var(--warm)]" />
              <h2 className="text-sm font-extrabold">Previous lab runs</h2>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--fg)]"
              onClick={async () => {
                await api.clearLabHistory()
                void qc.invalidateQueries({ queryKey: ['lab-history'] })
              }}
            >
              Clear all
            </button>
          </div>
          <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
            {(history.data?.items || []).length === 0 && (
              <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-xs text-[var(--muted)]">
                No runs yet. Hit Run Lab to save results into <code>lab_history.json</code>.
              </p>
            )}
            {(history.data?.items || []).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  setQuery(h.query)
                  if (h.ranking_mode === 'relevance' || h.ranking_mode === 'personalized') setMode(h.ranking_mode)
                }}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-left transition hover:border-[var(--accent)]"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                  <Clock3 className="h-3 w-3" />
                  {new Date(h.created_at).toLocaleString()}
                </div>
                <div className="mt-1 text-sm font-bold text-[var(--fg)]">{h.query}</div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">
                  {h.result_count ?? 0} results · {h.ranking_mode || 'personalized'}
                  {h.intent?.max_price != null ? ` · ≤ ₹${h.intent.max_price}` : ''}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Status row */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Cpu,
                label: 'Encoder',
                value: status.data?.semantic.model_type === 'sentence-transformers' ? 'Loaded' : status.data?.semantic.model_type || '…',
                sub: status.data?.semantic.model_name || 'semantic model',
              },
              {
                icon: Layers,
                label: 'Shared Bottom',
                value: 'Ready',
                sub: String(status.data?.mmoe.architecture?.shared_bottom || 'ft-transformer'),
              },
              {
                icon: Target,
                label: 'Scoring',
                value: data ? 'Ready' : 'Idle',
                sub: data?.scoring_method || 'awaiting run',
              },
              {
                icon: History,
                label: 'History',
                value: `${history.data?.total ?? 0} lab runs`,
                sub: 'Saved on server JSON',
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow)]">
                <div className="flex items-center justify-between">
                  <s.icon className="h-4 w-4 text-[var(--accent)]" />
                  <span className="status-dot" />
                </div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">{s.label}</div>
                <div className="mt-1 text-sm font-extrabold text-[var(--fg)]">{s.value}</div>
                <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-1.5 shadow-[var(--shadow)]">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-xl px-3 py-2 text-xs font-bold transition md:text-sm',
                  tab === t.id
                    ? 'bg-[var(--accent)] text-white dark:text-[#0a1f44]'
                    : 'text-[var(--muted)] hover:text-[var(--fg)]',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!data && !run.isPending && (
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)] p-12 text-center shadow-[var(--shadow)]">
              <Sparkles className="mx-auto h-8 w-8 text-[var(--warm)]" />
              <h2 className="mt-4 font-display text-3xl">Ready when you are</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                Try “buds under 5k” — only relevant earbuds/headphones priced ≤ ₹5000 should appear.
              </p>
            </div>
          )}

          {run.isPending && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-64" />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {data && tab === 'results' && (
              <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl">Top Results</h3>
                    <p className="text-sm text-[var(--muted)]">
                      {data.results.length} ranked products
                      {data.intent?.max_price != null ? ` within ₹${data.intent.max_price.toLocaleString('en-IN')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                      <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} />
                      Show ranking details
                    </label>
                    <button type="button" onClick={exportJson} className="btn-ghost !px-3 !py-2 text-xs">
                      <Download className="h-3.5 w-3.5" /> Export
                    </button>
                  </div>
                </div>

                {data.results.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-sm text-[var(--muted)]">
                    No products matched this query’s constraints.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {data.results.slice(0, 9).map((r) => {
                      const wished = wishlist.some((w) => w.id === r.product.id)
                      return (
                        <article
                          key={r.product.id}
                          className="overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                        >
                          <div className="relative">
                            <img
                              src={r.product.image_url}
                              alt={r.product.name}
                              className="aspect-[4/3] w-full object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80'
                              }}
                            />
                            <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-white dark:text-[#0a1f44]">
                              #{r.rank}
                            </span>
                            {r.product.discount_percent ? (
                              <span className="absolute bottom-3 left-3 rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white">
                                {Math.round(r.product.discount_percent)}% OFF
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className={cn(
                                'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow',
                                wished && 'text-red-500',
                              )}
                              onClick={() => toggleWishlist(r.product)}
                            >
                              <Heart className={cn('h-4 w-4', wished && 'fill-current')} />
                            </button>
                          </div>
                          <div className="space-y-2 p-4">
                            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                              {r.product.brand}
                            </div>
                            <div className="text-sm font-extrabold leading-snug text-[var(--fg)]">{r.product.name}</div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Star className="h-3.5 w-3.5 fill-[#f5b942] text-[#f5b942]" />
                              <span className="font-semibold">{r.product.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-extrabold">{formatINR(r.product.price)}</span>
                              {r.product.original_price ? (
                                <span className="text-sm text-[var(--muted)] line-through">
                                  {formatINR(r.product.original_price)}
                                </span>
                              ) : null}
                            </div>
                            {showDetails && (
                              <div className="space-y-1.5 rounded-xl bg-[var(--bg)] p-3">
                                <ScoreBar label="Semantic" value={r.explanation.semantic_similarity} />
                                <ScoreBar label="Click" value={r.explanation.click_probability} />
                                <ScoreBar label="ATC" value={r.explanation.atc_probability} tone="warm" />
                                <p className="text-[11px] leading-relaxed text-[var(--muted)]">{r.explanation.why_this_result}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-1">
                              <Link to={`/products/${r.product.id}`} className="btn-primary flex-1 !rounded-full !py-2.5 text-xs">
                                View details
                              </Link>
                              <button
                                type="button"
                                className="btn-ghost !rounded-full !px-3"
                                onClick={async () => {
                                  addToCart(r.product)
                                  await api.postEvent({ event_type: 'atc', user_id: appUserId, product_id: r.product.id })
                                }}
                              >
                                <ShoppingBag className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {data && tab === 'comparison' && (
              <motion.div key="comparison" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-[var(--accent)]" />
                  <h3 className="font-display text-2xl">Ranking Comparison</h3>
                </div>
                {data.comparison ? (
                  <>
                    <p className="mt-2 text-sm text-[var(--muted)]">{data.comparison.interpretation}</p>
                    <div className="mt-6 font-display text-5xl">PD@10 = {data.pd_at_k?.toFixed(2)}</div>
                    <div className="mt-6 space-y-2">
                      {data.comparison.position_changes.slice(0, 10).map((c) => (
                        <div key={c.product_id} className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3 py-2.5 text-sm">
                          <span className="truncate font-semibold">{productLookup.get(c.product_id)?.name || c.product_id}</span>
                          <span className="font-bold">
                            #{c.relevance_rank} → #{c.personalized_rank}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">Run personalized mode to compute PD@K.</p>
                )}
              </motion.div>
            )}

            {data && tab === 'pipeline' && (
              <motion.div key="pipeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-[240px_1fr]">
                <div className="space-y-2">
                  {stages.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStage(stage.id)}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition',
                        activeStage === stage.id
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white dark:text-[#0a1f44]'
                          : 'border-[var(--line)] bg-[var(--card)]',
                      )}
                    >
                      <span className="font-bold">
                        {stage.id}. {stage.name}
                      </span>
                    </button>
                  ))}
                </div>
                {active && (
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[var(--shadow)]">
                    <h3 className="font-display text-2xl">{active.name}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">{active.description}</p>
                    <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-[var(--bg)] p-4 text-[11px]">
                      {JSON.stringify(active.output, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}

            {data && tab === 'features' && (
              <motion.div key="features" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-2">
                {data.results.slice(0, 6).map((r) => (
                  <div key={r.product.id} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow)]">
                    <div className="mb-3 text-sm font-extrabold">
                      #{r.rank} {r.product.name}
                    </div>
                    <div className="space-y-2">
                      <ScoreBar label="Semantic similarity" value={r.explanation.semantic_similarity} />
                      <ScoreBar label="Structured contribution" value={r.explanation.structured_contribution} />
                      <ScoreBar label="User preference" value={r.explanation.user_preference_contribution} tone="warm" />
                      <ScoreBar label="Click probability" value={r.explanation.click_probability} />
                      <ScoreBar label="ATC probability" value={r.explanation.atc_probability} tone="warm" />
                      <ScoreBar label="Purchase probability" value={r.explanation.purchase_probability} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {data && tab === 'json' && (
              <motion.div key="json" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[var(--shadow)]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-2xl">JSON Output</h3>
                  <button type="button" onClick={exportJson} className="btn-ghost !py-2 text-xs">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
                <pre className="max-h-[560px] overflow-auto rounded-xl bg-[var(--bg)] p-4 text-[11px] leading-relaxed">
                  {JSON.stringify(
                    {
                      history_id: data.history_id,
                      query: data.query,
                      intent: data.intent,
                      scoring_method: data.scoring_method,
                      pd_at_k: data.pd_at_k,
                      results: data.results.map((r) => ({
                        rank: r.rank,
                        score: r.score,
                        product: {
                          id: r.product.id,
                          name: r.product.name,
                          price: r.product.price,
                          brand: r.product.brand,
                        },
                        explanation: r.explanation,
                      })),
                    },
                    null,
                    2,
                  )}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
