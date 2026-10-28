export interface Product {
  id: string
  name: string
  brand: string
  category: string
  subcategory: string
  description: string
  price: number
  original_price: number | null
  discount_percent: number | null
  rating: number
  review_count: number
  popularity: number
  image_url: string
  attributes: Record<string, unknown>
  specs: Record<string, unknown>
  tags: string[]
}

export interface RankingExplanation {
  semantic_similarity: number
  structured_contribution: number
  user_preference_contribution: number
  click_probability: number
  atc_probability: number
  purchase_probability: number
  final_score: number
  scoring_method: string
  model_status: string
  why_this_result: string
  details?: Record<string, unknown>
}

export type RankingMode =
  | 'personalized'
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popularity'

export interface QueryIntent {
  raw_query?: string
  min_price?: number | null
  max_price?: number | null
  terms?: string[]
}

export interface SearchResultItem {
  product: Product
  rank: number
  score: number
  explanation: RankingExplanation | null
}

export interface SearchResponse {
  query: string
  ranking_mode: RankingMode
  personalization_enabled: boolean
  scoring_method: string
  model_status: string
  total: number
  page: number
  page_size: number
  results: SearchResultItem[]
  suggestions: string[]
  facets: { categories: string[]; brands: string[] }
  intent?: QueryIntent | null
}

export interface UserPreferences {
  user_id: string
  display_name: string
  preferred_categories: string[]
  preferred_brands: string[]
  preferred_attributes: string[]
  browsing_interests: string[]
  recent_interactions: string[]
  price_sensitivity: number
  personalization_enabled: boolean
}

export interface MetricPayload {
  value: number | null
  available: boolean
  definition: string
}

export interface AnalyticsOverview {
  total_products: number
  search_requests: number
  impressions: number
  clicks: number
  add_to_cart: number
  purchases: number
  ctr: MetricPayload
  atc_rate: MetricPayload
  purchase_conversion: MetricPayload
  activity_over_time: Array<{
    date: string
    search: number
    click: number
    atc: number
    purchase: number
  }>
  funnel: Array<{ stage: string; count: number }>
  category_engagement: Array<{ category: string; interactions: number }>
  events_are_demo: boolean
  disclaimer: string
}

export interface LabHistoryEntry {
  id: string
  created_at: string
  query: string
  user_id?: string
  ranking_mode?: string
  scoring_method?: string
  pd_at_k?: number | null
  intent?: QueryIntent
  result_count?: number
  top_results?: Array<{
    rank: number
    score: number
    product: Partial<Product>
    why?: string
  }>
}

export interface RankResponse {
  query: string
  ranking_mode: RankingMode
  personalization_enabled: boolean
  scoring_method: string
  model_status: string
  results: Array<{
    product: Product
    rank: number
    score: number
    explanation: RankingExplanation
  }>
  pd_at_k: number | null
  comparison: {
    relevance_ids: string[]
    personalized_ids: string[]
    position_changes: Array<{
      product_id: string
      relevance_rank: number | null
      personalized_rank: number
      delta: number | null
    }>
    pd_at_10: number
    interpretation: string
  } | null
  pipeline: {
    stages: Array<{
      id: number
      name: string
      description: string
      output: Record<string, unknown>
    }>
    disclaimer: string
  } | null
  intent?: QueryIntent | null
  filtered_count?: number | null
  candidate_count_before_intent?: number | null
  history_id?: string | null
}

export interface ModelStatus {
  semantic: {
    ready: boolean
    model_name: string
    model_type: string
    device: string
    cached_products: number
    note: string
  }
  mmoe: {
    status: string
    checkpoint_path: string | null
    loaded_from_checkpoint: boolean
    architecture: Record<string, unknown>
    note: string
  }
  device: string
  gpu_required: boolean
}
