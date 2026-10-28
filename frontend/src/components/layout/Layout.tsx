import { Outlet } from 'react-router-dom'
import { RankWiseLogo } from '@/components/brand/RankWiseLogo'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { OnboardingModal } from '@/components/tutorial/OnboardingModal'
import { Navbar } from './Navbar'
import { ToastStack } from './ToastStack'

export function Layout() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="mt-8 border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-10 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between md:px-6">
          <RankWiseLogo subtitle />
          <p>Personalized product search ranking demo · Lab runs saved to JSON history</p>
        </div>
      </footer>
      <ToastStack />
      <OnboardingModal />
      <CartDrawer />
    </div>
  )
}
