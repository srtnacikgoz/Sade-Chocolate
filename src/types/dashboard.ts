// src/types/dashboard.ts
// Dashboard Analytics Types
// SaaS-Dostu: Config-driven, multi-tenant ready

// =====================================================
// DATE RANGE TYPES
// =====================================================

export type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'last_30_days' | 'last_90_days' | 'custom'

export type DateRange = {
  preset: DateRangePreset
  startDate: string  // ISO date
  endDate: string    // ISO date
  label: string      // Görüntülenecek etiket
}

// =====================================================
// KPI TYPES
// =====================================================

export type KPICard = {
  id: string
  label: string
  value: number
  formattedValue: string
  previousValue: number | null
  change: number | null        // % değişim
  changeType: 'increase' | 'decrease' | 'neutral'
  unit: 'currency' | 'count' | 'percent'
  icon: string
  color: string
}

export type DashboardKPIs = {
  todaySales: KPICard
  weekSales: KPICard
  monthSales: KPICard
  avgOrderValue: KPICard
  conversionRate: KPICard
  activeVisitors: KPICard
  totalOrders: KPICard
  totalCustomers: KPICard
}

// =====================================================
// CHART DATA TYPES
// =====================================================

// Satış trendi (çizgi grafik)
export type SalesTrendDataPoint = {
  date: string       // YYYY-MM-DD
  label: string      // "1 Oca", "2 Oca" gibi
  revenue: number
  orders: number
  previousRevenue?: number  // Karşılaştırma için
}

// Saatlik sipariş dağılımı (bar chart)
export type HourlyDistributionDataPoint = {
  hour: number       // 0-23
  label: string      // "00:00", "01:00" gibi
  orders: number
  revenue: number
}

// Trafik kaynakları (pie chart)
export type TrafficSourceDataPoint = {
  source: string     // "direct", "google", "instagram", etc.
  label: string      // Görüntülenecek ad
  visitors: number
  percentage: number
  color: string
}

// En çok satan ürünler (horizontal bar)
export type TopProductDataPoint = {
  productId: string
  productName: string
  quantity: number
  revenue: number
  percentage: number  // Toplam satışın yüzdesi
}

// Sipariş durumu dağılımı
export type OrderStatusDataPoint = {
  status: string
  label: string
  count: number
  percentage: number
  color: string
}

// =====================================================
// DASHBOARD DATA
// =====================================================

export type DashboardData = {
  // KPI'lar
  kpis: DashboardKPIs

  // Grafikler
  salesTrend: SalesTrendDataPoint[]
  hourlyDistribution: HourlyDistributionDataPoint[]
  trafficSources: TrafficSourceDataPoint[]
  topProducts: TopProductDataPoint[]
  orderStatusDistribution: OrderStatusDataPoint[]

  // Meta
  dateRange: DateRange
  calculatedAt: string
  isRealTime: boolean
}

// =====================================================
// DASHBOARD CONFIG
// =====================================================

export type DashboardConfig = {
  // Feature flag
  enabled: boolean

  // Görünüm ayarları
  defaultDateRange: DateRangePreset
  showComparison: boolean
  comparisonPeriod: 'previous_period' | 'previous_year'

  // Refresh ayarları
  autoRefresh: boolean
  refreshIntervalSeconds: number

  // Görünür KPI'lar (sıralı)
  visibleKPIs: string[]

  // Görünür grafikler (sıralı)
  visibleCharts: ('salesTrend' | 'hourlyDistribution' | 'trafficSources' | 'topProducts' | 'orderStatus')[]

  // Top ürün limiti
  topProductsLimit: number

  // Meta
  updatedAt: string
  updatedBy: string | null
}

// =====================================================
// DEFAULT CONFIG
// =====================================================

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  enabled: true,
  defaultDateRange: 'this_month',
  showComparison: true,
  comparisonPeriod: 'previous_period',
  autoRefresh: true,
  refreshIntervalSeconds: 60,
  visibleKPIs: ['todaySales', 'weekSales', 'monthSales', 'avgOrderValue', 'conversionRate', 'activeVisitors'],
  visibleCharts: ['salesTrend', 'hourlyDistribution', 'topProducts', 'trafficSources'],
  topProductsLimit: 5,
  updatedAt: new Date().toISOString(),
  updatedBy: null
}

// =====================================================
// DATE RANGE PRESETS
// =====================================================

export const DATE_RANGE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'yesterday', label: 'Dün' },
  { id: 'this_week', label: 'Bu Hafta' },
  { id: 'last_week', label: 'Geçen Hafta' },
  { id: 'this_month', label: 'Bu Ay' },
  { id: 'last_month', label: 'Geçen Ay' },
  { id: 'last_30_days', label: 'Son 30 Gün' },
  { id: 'last_90_days', label: 'Son 90 Gün' },
  { id: 'custom', label: 'Özel Tarih' }
]

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * DateRangePreset'i gerçek tarihlere çevir
 */
export function getDateRangeFromPreset(preset: DateRangePreset): { startDate: Date; endDate: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: now }

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayEnd = new Date(yesterday)
      yesterdayEnd.setHours(23, 59, 59, 999)
      return { startDate: yesterday, endDate: yesterdayEnd }
    }

    case 'this_week': {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Pazartesi
      return { startDate: startOfWeek, endDate: now }
    }

    case 'last_week': {
      const startOfLastWeek = new Date(today)
      startOfLastWeek.setDate(today.getDate() - today.getDay() - 6)
      const endOfLastWeek = new Date(startOfLastWeek)
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6)
      endOfLastWeek.setHours(23, 59, 59, 999)
      return { startDate: startOfLastWeek, endDate: endOfLastWeek }
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate: startOfMonth, endDate: now }
    }

    case 'last_month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      endOfLastMonth.setHours(23, 59, 59, 999)
      return { startDate: startOfLastMonth, endDate: endOfLastMonth }
    }

    case 'last_30_days': {
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      return { startDate: thirtyDaysAgo, endDate: now }
    }

    case 'last_90_days': {
      const ninetyDaysAgo = new Date(today)
      ninetyDaysAgo.setDate(today.getDate() - 90)
      return { startDate: ninetyDaysAgo, endDate: now }
    }

    default:
      return { startDate: today, endDate: now }
  }
}

/**
 * Önceki karşılaştırma dönemini hesapla
 */
export function getPreviousPeriod(startDate: Date, endDate: Date): { startDate: Date; endDate: Date } {
  const duration = endDate.getTime() - startDate.getTime()
  const previousEndDate = new Date(startDate.getTime() - 1)
  const previousStartDate = new Date(previousEndDate.getTime() - duration)

  return { startDate: previousStartDate, endDate: previousEndDate }
}

/**
 * Değişim yüzdesini hesapla
 */
export function calculateChange(current: number, previous: number): { change: number; type: 'increase' | 'decrease' | 'neutral' } {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, type: current > 0 ? 'increase' : 'neutral' }
  }

  const change = ((current - previous) / previous) * 100

  return {
    change: Math.round(change * 10) / 10,
    type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
  }
}

/**
 * Para birimini formatla
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Sayıyı kısalt (1.2K, 1.5M gibi)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}
