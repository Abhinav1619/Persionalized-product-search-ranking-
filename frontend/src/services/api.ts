import type {
  AnalyticsOverview,
  LabHistoryEntry,
  ModelStatus,
  Product,
  RankResponse,
  RankingMode,
  SearchResponse,
  UserPreferences,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<{ status: string }>('/api/health'),

  listProducts: (params?: { page?: number; page_size?: number; category?: string; featured?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.page_size) q.set('page_size', String(params.page_size))
    if (params?.category) q.set('category', params.category)
    if (params?.featured) q.set('featured', 'true')
    return request<{ items: Product[]; total: number; categories: string[]; brands: string[] }>(
      `/api/products?${q.toString()}`,
    )
  },

  getProduct: (id: string) =>
    request<{
      product: Product
      similar_products: Product[]
      related_search_terms: string[]
      why_recommend: string
    }>(`/api/products/${id}`),

  autocomplete: (q: string) =>
    request<{ suggestions: string[]; popular_queries: string[] }>(
      `/api/search/autocomplete?q=${encodeURIComponent(q)}`,
    ),

  search: (body: {
    query: string
    user_id: string
    ranking_mode: RankingMode
    personalization_enabled?: boolean
    filters?: {
      category?: string
      brand?: string
      min_price?: number
      max_price?: number
      min_rating?: number
    }
    page?: number
    page_size?: number
  }) =>
    request<SearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  rank: (body: {
    query: string
    user_id: string
    ranking_mode: RankingMode
    personalization_enabled?: boolean
  }) =>
    request<RankResponse>('/api/rank', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  postEvent: (body: {
    event_type: 'impression' | 'click' | 'atc' | 'purchase' | 'wishlist' | 'search'
    user_id: string
    product_id?: string
    query?: string
    metadata?: Record<string, unknown>
  }) =>
    request('/api/events', {
      method: 'POST',
      body: JSON.stringify({ ...body, is_demo: true }),
    }),

  analyticsOverview: () => request<AnalyticsOverview>('/api/analytics/overview'),
  analyticsRanking: () => request<Record<string, unknown>>('/api/analytics/ranking'),
  modelStatus: () => request<ModelStatus>('/api/models/status'),

  listUsers: () => request<UserPreferences[]>('/api/users'),
  getPreferences: (userId: string) => request<UserPreferences>(`/api/users/${userId}/preferences`),
  updatePreferences: (userId: string, body: Partial<UserPreferences>) =>
    request<UserPreferences>(`/api/users/${userId}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  labHistory: (limit = 20) => request<{ items: LabHistoryEntry[]; total: number }>(`/api/lab/history?limit=${limit}`),
  labHistoryDetail: (id: string) => request<LabHistoryEntry>(`/api/lab/history/${id}`),
  clearLabHistory: () => request<{ ok: boolean }>('/api/lab/history', { method: 'DELETE' }),
}
