import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'

interface Props {
  initialQuery?: string
  large?: boolean
  onSubmitQuery?: (q: string) => void
}

export function SearchBar({ initialQuery = '', large, onSubmitQuery }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [popular, setPopular] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const data = await api.autocomplete(query)
        setSuggestions(data.suggestions)
        setPopular(data.popular_queries)
      } catch {
        /* ignore while typing */
      }
    }, 180)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submit = (q: string) => {
    const value = q.trim()
    if (!value) return
    setOpen(false)
    if (onSubmitQuery) onSubmitQuery(value)
    else navigate(`/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <div ref={wrapRef} className={cn('relative w-full', large ? 'max-w-3xl' : 'max-w-xl')}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(query)
        }}
        className={cn(
          'flex items-center gap-2 rounded-full border border-[var(--line)] bg-white shadow-[var(--shadow)] transition focus-within:border-[var(--accent)] dark:bg-[var(--card)]',
          large ? 'px-4 py-2 pl-5' : 'px-3 py-2',
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products, brands, or intents…"
          className="w-full bg-transparent text-sm font-medium text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
          aria-label="Search products"
        />
        <button
          type="submit"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-92 dark:text-[#0a1f44]"
        >
          Search
        </button>
      </form>

      {open && (suggestions.length > 0 || popular.length > 0) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-xl">
          {suggestions.length > 0 && (
            <div className="border-b border-[var(--line)] p-2">
              <p className="px-2 py-1 text-xs uppercase tracking-wide text-[var(--muted)]">Suggestions</p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg)]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="p-2">
            <p className="px-2 py-1 text-xs uppercase tracking-wide text-[var(--muted)]">Popular</p>
            {popular.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg)]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
