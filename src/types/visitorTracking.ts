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

// Goruntulenen urun bilgisi
export type ViewedProduct = {
  productId: string
  productName: string
  productPrice: number
  productImage: string | null
  viewedAt: Date
  viewType: 'hover' | 'quickview' | 'detail'
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
  viewedProducts: ViewedProduct[]
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

// =====================================================
// RECOVERY EMAIL CONFIG
// Firestore: settings/recovery_email
// =====================================================

export type RecoveryEmailConfig = {
  // Feature flag - sistem acik/kapali
  enabled: boolean

  // Email gonderim zamanlari (dakika cinsinden)
  // Ornek: [60, 1440, 4320] = 1 saat, 24 saat, 72 saat sonra
  emailScheduleMinutes: number[]

  // Minimum sepet degeri (TL) - bu degerin altindaki sepetler icin email gonderilmez
  minCartValue: number

  // Sepet basina maximum email sayisi
  maxEmailsPerCart: number

  // Indirim kodu ozellikleri
  discountEnabled: boolean
  discountPercent: number
  discountValidityHours: number

  // Email konulari (sirayla kullanilir)
  emailSubjects: {
    first: string   // Ilk email
    second: string  // Ikinci email
    third: string   // Ucuncu email
  }

  // Email icerik ayarlari
  showProductImages: boolean
  showOriginalPrices: boolean
  ctaButtonText: string
}

export const DEFAULT_RECOVERY_EMAIL_CONFIG: RecoveryEmailConfig = {
  enabled: true,
  emailScheduleMinutes: [60, 1440, 4320], // 1 saat, 24 saat, 72 saat
  minCartValue: 100,
  maxEmailsPerCart: 3,
  discountEnabled: true,
  discountPercent: 10,
  discountValidityHours: 48,
  emailSubjects: {
    first: 'Sepetinizi unutmadık 🛒',
    second: 'Son fırsat: %10 indirim kodu!',
    third: 'Çikolatalarınız hâlâ sizi bekliyor'
  },
  showProductImages: true,
  showOriginalPrices: true,
  ctaButtonText: 'Alışverişe Devam Et'
}

// Recovery email log kaydi
export type RecoveryEmailLog = {
  id: string
  abandonedCartId: string
  customerEmail: string
  customerName: string | null
  cartValue: number
  emailNumber: 1 | 2 | 3        // Kacinci email
  subject: string
  sentAt: Date
  openedAt: Date | null
  clickedAt: Date | null
  convertedAt: Date | null      // Satis yapildiysa
  convertedOrderId: string | null
  discountCode: string | null
  discountUsed: boolean
}

// AbandonedCart tipine eklenen alanlar
export type AbandonedCartExtended = AbandonedCart & {
  recoveryEmailCount: number    // Gonderilen email sayisi
  lastRecoveryEmailAt: Date | null
  recoveryEmailLogs: string[]   // Log ID'leri
  recovered: boolean            // Sepet kurtarildi mi
  recoveredOrderId: string | null
}

// =====================================================
// STOK UYARI SİSTEMİ CONFIG
// Firestore: settings/stock_alert
// =====================================================

export type StockAlertChannel = 'telegram' | 'email'

export type StockAlertConfig = {
  // Feature flag - sistem acik/kapali
  enabled: boolean

  // Varsayilan minimum stok esigi (urun bazinda override edilebilir)
  defaultMinStock: number

  // Bildirim kanallari
  alertChannels: StockAlertChannel[]

  // Telegram ayarlari
  telegramChatId: string
  telegramBotToken: string // Environment variable'dan alinmali

  // Email alicilari
  emailRecipients: string[]

  // Uyari sikligi - ayni urun icin tekrar uyari ne zaman gonderilsin
  alertCooldownHours: number  // 24 saat = ayni urun icin gunde 1 uyari

  // Kritik stok esigi (0 = tukendi)
  criticalThreshold: number

  // Gunluk ozet raporu gonder
  dailyDigestEnabled: boolean
  dailyDigestTime: string  // "09:00" formatinda
}

export const DEFAULT_STOCK_ALERT_CONFIG: StockAlertConfig = {
  enabled: true,
  defaultMinStock: 5,
  alertChannels: ['telegram'],
  telegramChatId: '', // Admin panelden ayarlanacak
  telegramBotToken: '', // Environment variable
  emailRecipients: [],
  alertCooldownHours: 24,
  criticalThreshold: 0,
  dailyDigestEnabled: true,
  dailyDigestTime: '09:00'
}

// Stok uyari log kaydi
export type StockAlertLog = {
  id: string
  productId: string
  productName: string
  currentStock: number
  minStock: number
  alertType: 'low' | 'critical' | 'out_of_stock'
  channels: StockAlertChannel[]   // Hangi kanallara gonderildi
  sentAt: Date
  acknowledged: boolean           // Admin tarafindan goruldu mu
  acknowledgedAt: Date | null
  acknowledgedBy: string | null
}
