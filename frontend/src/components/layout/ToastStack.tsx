import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '@/context/AppContext'
import { cn } from '@/utils/cn'

export function ToastStack() {
  const { toasts } = useApp()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn(
              'rounded-xl border px-4 py-3 text-sm shadow-lg',
              t.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
              t.tone === 'error' && 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
              (!t.tone || t.tone === 'info') && 'border-[var(--line)] bg-[var(--card)] text-[var(--fg)]',
            )}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
