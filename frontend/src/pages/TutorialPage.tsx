import { motion } from 'framer-motion'
import {
  ArrowRight,
  Beaker,
  ChartColumn,
  Filter,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const chapters = [
  {
    icon: Search,
    title: '1. Search with natural language',
    body: 'Use intent-rich queries instead of single keywords. Example: “lightweight laptop for programming” or “skincare for oily skin”.',
    cta: { to: '/search?q=lightweight%20laptop%20for%20programming', label: 'Try a sample search' },
  },
  {
    icon: Filter,
    title: '2. Filter and sort results',
    body: 'Narrow by category, brand, price, and rating. Switch ranking modes: Personalized, Relevance only, Price, Rating, or Popularity.',
    cta: { to: '/search', label: 'Open search' },
  },
  {
    icon: UserRound,
    title: '3. Set a demo shopper profile',
    body: 'Choose Fitness, Developer, Skincare, or Office Professional. Preferred categories and brands change personalized ranking.',
    cta: { to: '/preferences', label: 'Edit preferences' },
  },
  {
    icon: Beaker,
    title: '4. Run the AI Ranking Lab',
    body: 'Enter a query, pick a profile, and run the pipeline. Watch TinyBERT-style encoding, semantic scores, MMoE towers, and PD@K.',
    cta: { to: '/lab', label: 'Open AI Lab' },
  },
  {
    icon: ChartColumn,
    title: '5. Review AI Insights',
    body: 'See live demo analytics from your clicks and cart actions. Paper reference metrics are labeled separately from app data.',
    cta: { to: '/insights', label: 'View insights' },
  },
  {
    icon: SlidersHorizontal,
    title: '6. Compare personalization',
    body: 'Toggle personalization off in Profile or use Relevance-only mode to see how rankings change without user features.',
    cta: { to: '/preferences', label: 'Toggle personalization' },
  },
]

export function TutorialPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="max-w-3xl">
        <p className="section-eyebrow">How to use RankWise</p>
        <h1 className="mt-3 font-display text-5xl">A guided tour of personalized search</h1>
        <p className="mt-4 text-[var(--muted)]">
          Follow these steps once — then explore the storefront, lab, and insights as a full AI ranking product demo.
        </p>
        <button
          type="button"
          className="btn-ghost mt-5"
          onClick={() => {
            localStorage.removeItem('rw_tutorial_done')
            window.location.href = '/'
          }}
        >
          <Sparkles className="h-4 w-4" /> Replay welcome tutorial
        </button>
      </div>

      <div className="mt-10 space-y-4">
        {chapters.map((c, i) => (
          <motion.article
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="card-premium grid gap-5 p-6 md:grid-cols-[72px_1fr_auto] md:items-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
              <c.icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{c.body}</p>
            </div>
            <Link to={c.cta.to} className="btn-primary w-fit">
              {c.cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.article>
        ))}
      </div>

      <div className="card-surface mt-10 overflow-hidden md:grid md:grid-cols-2">
        <div className="p-8">
          <h2 className="font-display text-3xl">Suggested first run</h2>
          <ol className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <li>1. Set profile to Aisha (Fitness Enthusiast).</li>
            <li>2. Search “wireless headphones for gym under ₹5000”.</li>
            <li>3. Switch ranking to Relevance only and compare order.</li>
            <li>4. Open AI Lab with the same query and inspect PD@10.</li>
          </ol>
          <Link to="/search?q=wireless%20headphones%20for%20gym%20under%20%E2%82%B95000" className="btn-primary mt-6">
            Start with this search
          </Link>
        </div>
        <div className="min-h-56 bg-[url('https://images.unsplash.com/photo-1556745753-b290485bf8fa?w=1200&q=80')] bg-cover bg-center" />
      </div>
    </div>
  )
}
