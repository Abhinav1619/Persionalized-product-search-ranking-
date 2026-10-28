import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Beaker, BookOpen, Search, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RankWiseLogo } from '@/components/brand/RankWiseLogo'
import { useApp } from '@/context/AppContext'
import { cn } from '@/utils/cn'

const STEPS = [
  {
    icon: BookOpen,
    title: 'Welcome to RankWise AI',
    body: 'This demo shows personalized product search ranking — semantic matching plus user preferences — as described in the multi-task learning project.',
  },
  {
    icon: Search,
    title: 'Search with real intent',
    body: 'Try queries like “wireless headphones for gym under ₹5000”. Filters and ranking modes change the order instantly.',
  },
  {
    icon: UserRound,
    title: 'Pick a demo profile',
    body: 'Open Profile to switch between fitness, developer, skincare, or office personas. Personalization reshuffles results.',
  },
  {
    icon: Beaker,
    title: 'Run the AI Lab',
    body: 'The Ranking Lab visualizes the full pipeline and computes PD@K — how much personalization changes the top-10.',
  },
]

export function OnboardingModal() {
  const { pushToast } = useApp()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('rw_tutorial_done')
    if (!seen) setOpen(true)
  }, [])

  const close = (markDone = true) => {
    if (markDone) localStorage.setItem('rw_tutorial_done', '1')
    setOpen(false)
  }

  const next = () => {
    if (step >= STEPS.length - 1) {
      close(true)
      pushToast('Tutorial complete — try a search or open the AI Lab', 'success')
      return
    }
    setStep((s) => s + 1)
  }

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,22,40,0.55)] p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-lg)]"
          >
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-[color-mix(in_srgb,var(--warm)_25%,transparent)] to-transparent" />
            <button
              type="button"
              aria-label="Close tutorial"
              onClick={() => close(true)}
              className="absolute right-4 top-4 rounded-full border border-[var(--line)] bg-[var(--card)] p-2"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative p-7 pt-10">
              <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                <RankWiseLogo showWordmark={false} markClassName="!h-7 !w-7 !rounded-lg" />
                Quick start · {step + 1}/{STEPS.length}
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-white dark:text-[#0a1f44]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-3xl">{current.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{current.body}</p>

              <div className="mt-6 flex gap-2">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition',
                      i <= step ? 'bg-[var(--accent)]' : 'bg-[var(--line)]',
                    )}
                  />
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <Link to="/tutorial" onClick={() => close(true)} className="text-sm font-medium text-[var(--accent)]">
                  Full tutorial page
                </Link>
                <div className="flex gap-2">
                  {step > 0 && (
                    <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost">
                      Back
                    </button>
                  )}
                  <button type="button" onClick={next} className="btn-primary">
                    {step === STEPS.length - 1 ? 'Start exploring' : 'Next'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
