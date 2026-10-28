import { cn } from '@/utils/cn'

interface Props {
  className?: string
  markClassName?: string
  showWordmark?: boolean
  subtitle?: boolean
}

/** Brand mark: ascending rank bars + search lens — personalized product ranking. */
export function RankWiseLogo({
  className,
  markClassName,
  showWordmark = true,
  subtitle = false,
}: Props) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--accent)] shadow-sm',
          markClassName,
        )}
        aria-hidden
      >
        <svg viewBox="0 0 40 40" className="h-[22px] w-[22px]" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ranking bars */}
          <rect x="6" y="24" width="5" height="10" rx="1.5" className="fill-white/55" />
          <rect x="13.5" y="17" width="5" height="17" rx="1.5" className="fill-white/75" />
          <rect x="21" y="10" width="5" height="24" rx="1.5" fill="#c5944e" />
          {/* Search lens over top of ranking */}
          <circle cx="28.5" cy="12.5" r="5.2" stroke="white" strokeWidth="2.2" />
          <path d="M32.2 16.4L35.5 19.7" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          {/* AI node spark */}
          <circle cx="28.5" cy="12.5" r="1.6" fill="#c5944e" />
        </svg>
      </span>
      {showWordmark && (
        <span className="leading-tight">
          <span className="block text-[15px] font-extrabold tracking-tight text-[var(--fg)]">RankWise AI</span>
          {subtitle && (
            <span className="block text-[11px] font-medium text-[var(--muted)]">Personalized search ranking</span>
          )}
        </span>
      )}
    </span>
  )
}
