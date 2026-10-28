import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { AppProvider } from '@/context/AppContext'
import { AboutPage } from '@/pages/AboutPage'
import { CartPage } from '@/pages/CartPage'
import { HomePage } from '@/pages/HomePage'
import { InsightsPage } from '@/pages/InsightsPage'
import { LabPage } from '@/pages/LabPage'
import { PreferencesPage } from '@/pages/PreferencesPage'
import { ProductPage } from '@/pages/ProductPage'
import { SearchPage } from '@/pages/SearchPage'
import { TutorialPage } from '@/pages/TutorialPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/products/:id" element={<ProductPage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="/tutorial" element={<TutorialPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  )
}
