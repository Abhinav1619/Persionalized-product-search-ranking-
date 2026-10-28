import { motion } from 'framer-motion'

const cards = [
  {
    title: 'Problem',
    body: 'Modern product search must balance query relevance, engagement, and conversion — not a single ranking objective.',
  },
  {
    title: 'Single-task limits',
    body: 'Tree ensembles and deep tabular models often optimize one action and struggle with mixed tabular + text signals.',
  },
  {
    title: 'Multi-task learning',
    body: 'MMoE jointly predicts Click, Add-to-Cart (ATC), and Purchase (TRX) with shared experts and task-specific gates.',
  },
  {
    title: 'Tabular + non-tabular',
    body: 'Customer, product, and interaction features combine with TinyBERT-style text embeddings and GTE-style semantic scores.',
  },
  {
    title: 'TinyBERT role',
    body: 'Encodes query and product text; element-wise matching (x_matching) is richer than a plain dot product.',
  },
  {
    title: 'GTE role',
    body: 'Provides a semantic similarity score between the query and product document (title, brand, attributes).',
  },
  {
    title: 'Shared bottom',
    body: 'DCN-V2 or FT-Transformer contextualizes structured features into X_final before the expert layer.',
  },
  {
    title: 'MMoE',
    body: 'Shared experts, softmax gates per task, and MLP towers produce three probabilities under a weighted BCE loss.',
  },
  {
    title: 'Sampling & labels',
    body: 'Category stratification, impression bins, and positive/negative balancing; relevance via CTR, position, TRX, and semantics.',
  },
  {
    title: 'Evaluation',
    body: 'AUC-ROC and MRR@K for task quality; PD@K measures top-K overlap with vs without user-specific features.',
  },
]

export function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--accent)]">About the model</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">
          Personalized Product Search Ranking with Multi-Task Learning
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          Terminology preserved from the PS1 presentation. This product demonstrates the architecture with a working
          semantic + personalized demo ranker; it does not claim to reproduce unpublished proprietary weights.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            className="card-surface p-5"
          >
            <h3 className="font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{c.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="card-surface mt-10 overflow-hidden p-0 md:grid md:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 md:p-8">
          <h2 className="font-display text-3xl">Architecture at a glance</h2>
          <ol className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>1. Query + product text → TinyBERT-style embeddings → element-wise match</li>
            <li>2. Semantic similarity score (GTE-style cosine)</li>
            <li>3. Structured customer / product / interaction features</li>
            <li>4. Shared bottom (DCN-V2 or FT-Transformer)</li>
            <li>5. MMoE experts → task gates → Click / ATC / TRX towers</li>
            <li>6. Final personalized ranking</li>
          </ol>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Source framing: Morishetti et al., 2025 IEEE Big Data (as summarized in the course presentation). The paper
            does not publish source code.
          </p>
        </div>
        <div className="min-h-56 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80')] bg-cover bg-center" />
      </div>
    </div>
  )
}
