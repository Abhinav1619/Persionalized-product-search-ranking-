import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { RankWiseLogo } from '@/components/brand/RankWiseLogo'
import { useApp } from '@/context/AppContext'
import { cn } from '@/utils/cn'

const links = [
  { to: '/', label: 'Discover' },
  { to: '/search', label: 'Search' },
  { to: '/lab', label: 'AI Lab' },
  { to: '/insights', label: 'Insights' },
  { to: '/tutorial', label: 'Tutorial' },
  { to: '/preferences', label: 'Profile' },
  { to: '/about', label: 'About' },
]

export function Navbar() {
  const { dark, toggleDark, cartCount, wishlist, setCartOpen } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
        <Link to="/" className="flex items-center" aria-label="RankWise AI home">
          <RankWiseLogo />
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-[var(--accent)] text-white dark:text-[#0a1f44]'
                    : 'text-[var(--muted)] hover:text-[var(--fg)]',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Search"
            onClick={() => navigate('/search')}
            className="rounded-full p-2.5 text-[var(--fg)] hover:bg-[var(--card)]"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleDark}
            className="rounded-full p-2.5 text-[var(--fg)] hover:bg-[var(--card)]"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Wishlist"
            onClick={() => navigate('/preferences')}
            className="relative rounded-full p-2.5 text-[var(--fg)] hover:bg-[var(--card)]"
          >
            <Heart className="h-4 w-4" />
            {wishlist.length > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--warm)]" />
            )}
          </button>
          <button
            type="button"
            aria-label="Open cart"
            onClick={() => setCartOpen(true)}
            className="relative rounded-full p-2.5 text-[var(--fg)] hover:bg-[var(--card)]"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white dark:text-[#0a1f44]">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="rounded-full p-2.5 xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--line)] bg-[var(--card)] px-4 py-3 xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3 py-2.5 text-sm font-semibold',
                    isActive ? 'bg-[var(--accent)] text-white dark:text-[#0a1f44]' : 'text-[var(--muted)]',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
