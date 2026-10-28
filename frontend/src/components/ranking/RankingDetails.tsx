import type { RankingExplanation } from '@/types'

function Bar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function RankingDetails({ explanation }: { explanation: RankingExplanation }) {
  return (
    <div className="card-surface space-y-3 p-4">
      <div>
        <h4 className="text-sm font-semibold">AI Ranking Details</h4>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Method: {explanation.scoring_method} · Status: {explanation.model_status}
        </p>
      </div>
      <Bar label="Semantic similarity" value={explanation.semantic_similarity} />
      <Bar label="Structured contribution" value={explanation.structured_contribution} />
      <Bar label="User preference" value={explanation.user_preference_contribution} />
      <Bar label="Click probability" value={explanation.click_probability} />
      <Bar label="Add-to-cart probability" value={explanation.atc_probability} />
      <Bar label="Purchase probability" value={explanation.purchase_probability} />
      <Bar label="Final ranking score" value={explanation.final_score} />
      <p className="text-xs leading-relaxed text-[var(--muted)]">{explanation.why_this_result}</p>
    </div>
  )
}
