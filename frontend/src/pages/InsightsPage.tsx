import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '@/services/api'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div> : null}
    </div>
  )
}

export function InsightsPage() {
  const overview = useQuery({ queryKey: ['analytics-overview'], queryFn: api.analyticsOverview })
  const ranking = useQuery({ queryKey: ['analytics-ranking'], queryFn: api.analyticsRanking })
  const models = useQuery({ queryKey: ['model-status'], queryFn: api.modelStatus })

  const o = overview.data
  const ref = (ranking.data?.published_reference_results || {}) as {
    best_model?: string
    mrr_at_1?: Record<string, { click: number | null; atc: number | null; trx: number | null }>
    note?: string
    pd_at_10_range?: { min: number; max: number; interpretation: string }
  }

  const comparisonRows = Object.entries(ref.mrr_at_1 || {}).map(([model, vals]) => ({
    model,
    click: vals.click,
    atc: vals.atc,
    trx: vals.trx,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="font-display text-4xl">AI Insights</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Live metrics come from demo events recorded in this app. Paper numbers appear only in the published reference
        section.
      </p>

      {overview.isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : o ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Indexed products" value={String(o.total_products)} />
            <Stat label="Search requests" value={String(o.search_requests)} hint="Demo events" />
            <Stat
              label="CTR"
              value={o.ctr.available && o.ctr.value != null ? `${(o.ctr.value * 100).toFixed(1)}%` : '—'}
              hint={o.ctr.definition}
            />
            <Stat
              label="Purchase conversion"
              value={
                o.purchase_conversion.available && o.purchase_conversion.value != null
                  ? `${(o.purchase_conversion.value * 100).toFixed(1)}%`
                  : '—'
              }
              hint={o.purchase_conversion.definition}
            />
          </div>

          <p className="mt-3 text-xs text-[var(--muted)]">{o.disclaimer}</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card-surface p-4">
              <h3 className="mb-4 font-semibold">Search activity (7 days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={o.activity_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="search" stroke="#3d4f7a" strokeWidth={2} />
                    <Line type="monotone" dataKey="click" stroke="#c4a574" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card-surface p-4">
              <h3 className="mb-4 font-semibold">Click → ATC → Purchase funnel</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={o.funnel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3d4f7a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card-surface p-4">
              <h3 className="mb-4 font-semibold">Category engagement</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={o.category_engagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="interactions" fill="#c4a574" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card-surface space-y-3 p-4">
              <h3 className="font-semibold">Model & inference status</h3>
              {models.data ? (
                <>
                  <p className="text-sm">
                    Semantic encoder: <strong>{models.data.semantic.model_name}</strong> (
                    {models.data.semantic.model_type})
                  </p>
                  <p className="text-sm text-[var(--muted)]">{models.data.semantic.note}</p>
                  <p className="text-sm">
                    MMoE status: <strong>{models.data.mmoe.status}</strong>
                  </p>
                  <p className="text-sm text-[var(--muted)]">{models.data.mmoe.note}</p>
                  <p className="text-xs text-[var(--muted)]">GPU required: {String(models.data.gpu_required)}</p>
                </>
              ) : (
                <p className="text-sm text-[var(--muted)]">Loading model status…</p>
              )}
            </div>
          </div>
        </>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-3xl">Published reference results</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{ref.note}</p>
        <p className="mt-1 text-sm">Best reported configuration: {ref.best_model}</p>
        <div className="card-surface mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Click MRR@1</th>
                <th className="px-4 py-3 font-medium">ATC MRR@1</th>
                <th className="px-4 py-3 font-medium">TRX MRR@1</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.model} className="border-b border-[var(--line)]">
                  <td className="px-4 py-3">{row.model}</td>
                  <td className="px-4 py-3">{row.click ?? '—'}</td>
                  <td className="px-4 py-3">{row.atc ?? '—'}</td>
                  <td className="px-4 py-3">{row.trx ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ref.pd_at_10_range && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Paper PD@10 range: {ref.pd_at_10_range.min}–{ref.pd_at_10_range.max}. {ref.pd_at_10_range.interpretation}
          </p>
        )}
      </section>

      <section className="mt-8 card-surface p-4 text-sm text-[var(--muted)]">
        <h3 className="font-semibold text-[var(--fg)]">Live evaluation metrics</h3>
        <p className="mt-2">
          AUC-ROC and MRR@K for this application are marked unavailable until a labeled evaluation set is provided.
          PD@K is computed live in the AI Ranking Lab for the query you run.
        </p>
      </section>
    </div>
  )
}
