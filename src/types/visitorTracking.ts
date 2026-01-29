// src/types/visitorTracking.ts
// Visitor Journey Tracking Type Definitions

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export type JourneyStage =
  | 'landing'
  | 'catalog'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'completed'
  | 'abandoned'

export type GeoLocation = {
  country: string | null
  countryCode: string | null
  city: string | null
  region: string | null
}

export type VisitorSession = {
  id: string
  visitorId: string
  customerEmail: string | null
  customerName: string | null
  isReturningCustomer: boolean
  device: DeviceType
  browser: string | null
  os: string | null
  screenResolution: string | null
  language: string | null
  referrer: string | null
  geo: GeoLocation | null
  startedAt: Date
  lastActivityAt: Date
  currentStage: JourneyStage
  cartValue: number
  cartItems: number
  pagesVisited: string[]
  isActive: boolean
}

export type AbandonedCart = {
  id: string
  sessionId: string
  visitorId: string
  customerEmail: string | null
  customerName: string | null
  cartValue: number
  cartItems: CartItemSummary[]
  abandonedAt: Date
  stage: 'cart' | 'checkout'
  notificationSent: boolean
  recoveryEmailSent: boolean
  geo: GeoLocation | null
}

export type CartItemSummary = {
  productId: string
  productName: string
  quantity: number
  price: number
}

export type DailyStats = {
  date: string
  totalVisitors: number
  uniqueVisitors: number
  cartAdditions: number
  checkoutStarts: number
  completedOrders: number
  abandonedCarts: number
  conversionRate: number
  avgCartValue: number
}

export type FunnelData = {
  landing: number
  catalog: number
  product: number
  cart: number
  checkout: number
  completed: number
}

export type TrackingConfig = {
  // Abandoned cart tespiti icin timeout (dakika)
  abandonedCartTimeoutMinutes: number
  // Telegram bildirimi icin minimum sepet degeri (TL)
  telegramMinCartValue: number
  // Checkout alert icin minimum sepet degeri (TL)
  checkoutAlertMinCartValue: number
  // VIP musteri bildirimi aktif mi
  vipCustomerAlertEnabled: boolean
}

// Default config degerleri
export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  abandonedCartTimeoutMinutes: 30,
  telegramMinCartValue: 200,
  checkoutAlertMinCartValue: 300,
  vipCustomerAlertEnabled: true
}

export type JourneyStageConfig = {
  id: JourneyStage
  label: string
  icon: string
  color: string
}

export const JOURNEY_STAGES: JourneyStageConfig[] = [
  { id: 'landing', label: 'Giris', icon: 'target', color: 'bg-gray-400' },
  { id: 'catalog', label: 'Katalog', icon: 'grid', color: 'bg-blue-400' },
  { id: 'product', label: 'Urun', icon: 'search', color: 'bg-purple-400' },
  { id: 'cart', label: 'Sepet', icon: 'shopping-cart', color: 'bg-yellow-500' },
  { id: 'checkout', label: 'Odeme', icon: 'credit-card', color: 'bg-orange-500' },
  { id: 'completed', label: 'Tamamlandi', icon: 'check-circle', color: 'bg-green-500' }
]
