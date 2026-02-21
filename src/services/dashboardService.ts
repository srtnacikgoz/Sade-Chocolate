// src/services/dashboardService.ts
// Dashboard Analytics Service
// SaaS-Dostu: Config-driven, real-time capable

import { db } from '../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import {
  DashboardConfig,
  DashboardData,
  DashboardKPIs,
  KPICard,
  SalesTrendDataPoint,
  HourlyDistributionDataPoint,
  TrafficSourceDataPoint,
  TopProductDataPoint,
  OrderStatusDataPoint,
  DateRange,
  DateRangePreset,
  DEFAULT_DASHBOARD_CONFIG,
  getDateRangeFromPreset,
  getPreviousPeriod,
  calculateChange,
  formatCurrency,
  formatCompactNumber
} from '../types/dashboard'

// =====================================================
// CONFIG MANAGEMENT
// =====================================================

/**
 * Dashboard konfigürasyonunu getir
 */
export async function getDashboardConfig(): Promise<DashboardConfig> {
  try {
    const configRef = doc(db, 'settings', 'dashboard_config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      return configSnap.data() as DashboardConfig
    }

    // İlk kez - default config'i kaydet
    await setDoc(configRef, DEFAULT_DASHBOARD_CONFIG)
    return DEFAULT_DASHBOARD_CONFIG
  } catch (error) {
    console.error('Dashboard config yüklenemedi:', error)
    return DEFAULT_DASHBOARD_CONFIG
  }
}

/**
 * Dashboard konfigürasyonunu güncelle
 */
export async function updateDashboardConfig(
  updates: Partial<DashboardConfig>,
  updatedBy?: string
): Promise<void> {
  try {
    const configRef = doc(db, 'settings', 'dashboard_config')
    await setDoc(configRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || null
    }, { merge: true })
  } catch (error) {
    console.error('Dashboard config güncellenemedi:', error)
    throw error
  }
}

// =====================================================
// DATA FETCHING
// =====================================================

/**
 * Ana dashboard verilerini getir
 */
export async function getDashboardData(
  preset: DateRangePreset = 'this_month',
  customStartDate?: string,
  customEndDate?: string
): Promise<DashboardData> {
  const config = await getDashboardConfig()

  // Tarih aralığını hesapla
  let startDate: Date
  let endDate: Date

  if (preset === 'custom' && customStartDate && customEndDate) {
    startDate = new Date(customStartDate)
    endDate = new Date(customEndDate)
  } else {
    const range = getDateRangeFromPreset(preset)
    startDate = range.startDate
    endDate = range.endDate
  }

  const dateRange: DateRange = {
    preset,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    label: getDateRangeLabel(preset, startDate, endDate)
  }

  // Önceki dönem
  const previousPeriod = getPreviousPeriod(startDate, endDate)

  // Paralel veri çekme
  const [
    kpis,
    salesTrend,
    hourlyDistribution,
    trafficSources,
    topProducts,
    orderStatusDistribution
  ] = await Promise.all([
    calculateKPIs(startDate, endDate, previousPeriod.startDate, previousPeriod.endDate),
    getSalesTrend(startDate, endDate, config.showComparison ? previousPeriod.startDate : undefined, config.showComparison ? previousPeriod.endDate : undefined),
    getHourlyDistribution(startDate, endDate),
    getTrafficSources(startDate, endDate),
    getTopProducts(startDate, endDate, config.topProductsLimit),
    getOrderStatusDistribution(startDate, endDate)
  ])

  return {
    kpis,
    salesTrend,
    hourlyDistribution,
    trafficSources,
    topProducts,
    orderStatusDistribution,
    dateRange,
    calculatedAt: new Date().toISOString(),
    isRealTime: config.autoRefresh
  }
}

// =====================================================
// KPI CALCULATIONS
// =====================================================

async function calculateKPIs(
  startDate: Date,
  endDate: Date,
  prevStartDate: Date,
  prevEndDate: Date
): Promise<DashboardKPIs> {
  // Mevcut dönem siparişleri
  const ordersRef = collection(db, 'orders')
  const currentOrdersQuery = query(
    ordersRef,
    where('createdAt', '>=', startDate.toISOString()),
    where('createdAt', '<=', endDate.toISOString())
  )
  const currentOrdersSnap = await getDocs(currentOrdersQuery)
  const currentOrders = currentOrdersSnap.docs.map(d => d.data())

  // Önceki dönem siparişleri
  const prevOrdersQuery = query(
    ordersRef,
    where('createdAt', '>=', prevStartDate.toISOString()),
    where('createdAt', '<=', prevEndDate.toISOString())
  )
  const prevOrdersSnap = await getDocs(prevOrdersQuery)
  const prevOrders = prevOrdersSnap.docs.map(d => d.data())

  // Bugünün siparişleri
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOrders = currentOrders.filter(o => new Date(o.createdAt) >= today)
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  // Bu haftanın siparişleri
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1)
  const weekOrders = currentOrders.filter(o => new Date(o.createdAt) >= startOfWeek)
  const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  // Geçen haftanın siparişleri (karşılaştırma)
  const lastWeekStart = new Date(startOfWeek)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(startOfWeek)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
  const lastWeekOrders = prevOrders.filter(o => {
    const date = new Date(o.createdAt)
    return date >= lastWeekStart && date <= lastWeekEnd
  })
  const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  // Bu ayın siparişleri
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthOrders = currentOrders.filter(o => new Date(o.createdAt) >= startOfMonth)
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  // Geçen ayın siparişleri
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
  const lastMonthOrders = prevOrders.filter(o => {
    const date = new Date(o.createdAt)
    return date >= lastMonthStart && date <= lastMonthEnd
  })
  const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  // Toplam gelir ve sipariş
  const totalRevenue = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const prevTotalRevenue = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  // AOV
  const avgOrderValue = currentOrders.length > 0 ? totalRevenue / currentOrders.length : 0
  const prevAvgOrderValue = prevOrders.length > 0 ? prevTotalRevenue / prevOrders.length : 0

  // Session/Visitor verileri
  const sessionsRef = collection(db, 'sessions')
  const todaySessionsQuery = query(
    sessionsRef,
    where('startedAt', '>=', Timestamp.fromDate(today))
  )
  const todaySessionsSnap = await getDocs(todaySessionsQuery)
  const todaySessions = todaySessionsSnap.docs.length

  // Dönüşüm oranı (bugün)
  const completedOrders = todayOrders.filter(o => o.status !== 'cancelled').length
  const conversionRate = todaySessions > 0 ? (completedOrders / todaySessions) * 100 : 0

  // Müşteri sayısı
  const customersRef = collection(db, 'customers')
  const customersSnap = await getDocs(customersRef)
  const totalCustomers = customersSnap.size

  // KPI kartlarını oluştur
  const weekChange = calculateChange(weekRevenue, lastWeekRevenue)
  const monthChange = calculateChange(monthRevenue, lastMonthRevenue)
  const aovChange = calculateChange(avgOrderValue, prevAvgOrderValue)

  return {
    todaySales: createKPICard('todaySales', 'Bugünün Satışları', todayRevenue, null, 'currency', 'shopping-cart', 'emerald'),
    weekSales: createKPICard('weekSales', 'Bu Hafta', weekRevenue, lastWeekRevenue, 'currency', 'calendar', 'blue'),
    monthSales: createKPICard('monthSales', 'Bu Ay', monthRevenue, lastMonthRevenue, 'currency', 'trending-up', 'violet'),
    avgOrderValue: createKPICard('avgOrderValue', 'Ort. Sepet', avgOrderValue, prevAvgOrderValue, 'currency', 'receipt', 'amber'),
    conversionRate: createKPICard('conversionRate', 'Dönüşüm', conversionRate, null, 'percent', 'target', 'cyan'),
    activeVisitors: createKPICard('activeVisitors', 'Bugün Ziyaretçi', todaySessions, null, 'count', 'users', 'slate'),
    totalOrders: createKPICard('totalOrders', 'Toplam Sipariş', currentOrders.length, prevOrders.length, 'count', 'package', 'indigo'),
    totalCustomers: createKPICard('totalCustomers', 'Toplam Müşteri', totalCustomers, null, 'count', 'user-plus', 'pink')
  }
}

function createKPICard(
  id: string,
  label: string,
  value: number,
  previousValue: number | null,
  unit: 'currency' | 'count' | 'percent',
  icon: string,
  color: string
): KPICard {
  let formattedValue: string
  let change: number | null = null
  let changeType: 'increase' | 'decrease' | 'neutral' = 'neutral'

  switch (unit) {
    case 'currency':
      formattedValue = formatCurrency(value)
      break
    case 'percent':
      formattedValue = `%${value.toFixed(1)}`
      break
    default:
      formattedValue = formatCompactNumber(value)
  }

  if (previousValue !== null) {
    const changeResult = calculateChange(value, previousValue)
    change = changeResult.change
    changeType = changeResult.type
  }

  return {
    id,
    label,
    value,
    formattedValue,
    previousValue,
    change,
    changeType,
    unit,
    icon,
    color
  }
}

// =====================================================
// CHART DATA
// =====================================================

async function getSalesTrend(
  startDate: Date,
  endDate: Date,
  prevStartDate?: Date,
  prevEndDate?: Date
): Promise<SalesTrendDataPoint[]> {
  const ordersRef = collection(db, 'orders')
  const ordersQuery = query(
    ordersRef,
    where('createdAt', '>=', startDate.toISOString()),
    where('createdAt', '<=', endDate.toISOString())
  )
  const ordersSnap = await getDocs(ordersQuery)
  const orders = ordersSnap.docs.map(d => d.data())

  // Günlük grupla
  const dailyData: Record<string, { revenue: number; orders: number }> = {}

  // Tüm günleri başlat
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0]
    dailyData[dateKey] = { revenue: 0, orders: 0 }
    current.setDate(current.getDate() + 1)
  }

  // Siparişleri grupla
  orders.forEach(order => {
    if (order.status === 'cancelled') return
    const dateKey = order.createdAt.split('T')[0]
    if (dailyData[dateKey]) {
      dailyData[dateKey].revenue += order.total || 0
      dailyData[dateKey].orders += 1
    }
  })

  // Önceki dönem (opsiyonel)
  let prevDailyData: Record<string, { revenue: number; orders: number }> = {}
  if (prevStartDate && prevEndDate) {
    const prevOrdersQuery = query(
      ordersRef,
      where('createdAt', '>=', prevStartDate.toISOString()),
      where('createdAt', '<=', prevEndDate.toISOString())
    )
    const prevOrdersSnap = await getDocs(prevOrdersQuery)
    const prevOrders = prevOrdersSnap.docs.map(d => d.data())

    const prevCurrent = new Date(prevStartDate)
    while (prevCurrent <= prevEndDate) {
      const dateKey = prevCurrent.toISOString().split('T')[0]
      prevDailyData[dateKey] = { revenue: 0, orders: 0 }
      prevCurrent.setDate(prevCurrent.getDate() + 1)
    }

    prevOrders.forEach(order => {
      if (order.status === 'cancelled') return
      const dateKey = order.createdAt.split('T')[0]
      if (prevDailyData[dateKey]) {
        prevDailyData[dateKey].revenue += order.total || 0
        prevDailyData[dateKey].orders += 1
      }
    })
  }

  // Sonuç dizisi
  const prevKeys = Object.keys(prevDailyData)
  return Object.entries(dailyData).map(([date, data], index) => {
    const dateObj = new Date(date)
    return {
      date,
      label: `${dateObj.getDate()} ${getMonthShort(dateObj.getMonth())}`,
      revenue: data.revenue,
      orders: data.orders,
      previousRevenue: prevKeys[index] ? prevDailyData[prevKeys[index]]?.revenue : undefined
    }
  })
}

async function getHourlyDistribution(startDate: Date, endDate: Date): Promise<HourlyDistributionDataPoint[]> {
  const ordersRef = collection(db, 'orders')
  const ordersQuery = query(
    ordersRef,
    where('createdAt', '>=', startDate.toISOString()),
    where('createdAt', '<=', endDate.toISOString())
  )
  const ordersSnap = await getDocs(ordersQuery)
  const orders = ordersSnap.docs.map(d => d.data())

  // Saatlik grupla
  const hourlyData: Record<number, { orders: number; revenue: number }> = {}
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { orders: 0, revenue: 0 }
  }

  orders.forEach(order => {
    if (order.status === 'cancelled') return
    const hour = new Date(order.createdAt).getHours()
    hourlyData[hour].orders += 1
    hourlyData[hour].revenue += order.total || 0
  })

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    label: `${hour.padStart(2, '0')}:00`,
    orders: data.orders,
    revenue: data.revenue
  }))
}

async function getTrafficSources(startDate: Date, endDate: Date): Promise<TrafficSourceDataPoint[]> {
  const sessionsRef = collection(db, 'sessions')
  const sessionsQuery = query(
    sessionsRef,
    where('startedAt', '>=', Timestamp.fromDate(startDate)),
    where('startedAt', '<=', Timestamp.fromDate(endDate))
  )
  const sessionsSnap = await getDocs(sessionsQuery)
  const sessions = sessionsSnap.docs.map(d => d.data())

  // Kaynak bazlı grupla
  const sourceData: Record<string, number> = {}
  const sourceColors: Record<string, string> = {
    direct: '#6366f1',
    google: '#10b981',
    instagram: '#ec4899',
    facebook: '#3b82f6',
    tiktok: '#000000',
    twitter: '#1d9bf0',
    email: '#f59e0b',
    referral: '#8b5cf6',
    other: '#64748b'
  }

  sessions.forEach(session => {
    const source = normalizeSource(session.referrer || 'direct')
    sourceData[source] = (sourceData[source] || 0) + 1
  })

  const total = Object.values(sourceData).reduce((sum, count) => sum + count, 0)

  return Object.entries(sourceData)
    .sort((a, b) => b[1] - a[1])
    .map(([source, visitors]) => ({
      source,
      label: getSourceLabel(source),
      visitors,
      percentage: total > 0 ? Math.round((visitors / total) * 100) : 0,
      color: sourceColors[source] || sourceColors.other
    }))
}

async function getTopProducts(startDate: Date, endDate: Date, limitCount: number): Promise<TopProductDataPoint[]> {
  const ordersRef = collection(db, 'orders')
  const ordersQuery = query(
    ordersRef,
    where('createdAt', '>=', startDate.toISOString()),
    where('createdAt', '<=', endDate.toISOString())
  )
  const ordersSnap = await getDocs(ordersQuery)
  const orders = ordersSnap.docs.map(d => d.data())

  // Ürün bazlı grupla
  const productData: Record<string, { name: string; quantity: number; revenue: number }> = {}

  orders.forEach(order => {
    if (order.status === 'cancelled') return
    (order.items || []).forEach((item: any) => {
      const productId = item.productId || item.id
      if (!productData[productId]) {
        productData[productId] = { name: item.name || item.productName || 'Bilinmeyen', quantity: 0, revenue: 0 }
      }
      productData[productId].quantity += item.quantity || 1
      productData[productId].revenue += (item.price || 0) * (item.quantity || 1)
    })
  })

  const totalRevenue = Object.values(productData).reduce((sum, p) => sum + p.revenue, 0)

  return Object.entries(productData)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limitCount)
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantity: data.quantity,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0
    }))
}

async function getOrderStatusDistribution(startDate: Date, endDate: Date): Promise<OrderStatusDataPoint[]> {
  const ordersRef = collection(db, 'orders')
  const ordersQuery = query(
    ordersRef,
    where('createdAt', '>=', startDate.toISOString()),
    where('createdAt', '<=', endDate.toISOString())
  )
  const ordersSnap = await getDocs(ordersQuery)
  const orders = ordersSnap.docs.map(d => d.data())

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Beklemede', color: '#f59e0b' },
    paid: { label: 'Ödendi', color: '#3b82f6' },
    preparing: { label: 'Hazırlanıyor', color: '#8b5cf6' },
    shipped: { label: 'Kargoda', color: '#06b6d4' },
    delivered: { label: 'Teslim Edildi', color: '#10b981' },
    cancelled: { label: 'İptal', color: '#ef4444' },
    refunded: { label: 'İade', color: '#f97316' }
  }

  const statusData: Record<string, number> = {}
  orders.forEach(order => {
    const status = order.status || 'pending'
    statusData[status] = (statusData[status] || 0) + 1
  })

  const total = orders.length

  return Object.entries(statusData)
    .map(([status, count]) => ({
      status,
      label: statusLabels[status]?.label || status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: statusLabels[status]?.color || '#64748b'
    }))
    .sort((a, b) => b.count - a.count)
}

// =====================================================
// HELPERS
// =====================================================

function getDateRangeLabel(preset: DateRangePreset, startDate: Date, endDate: Date): string {
  const labels: Record<DateRangePreset, string> = {
    today: 'Bugün',
    yesterday: 'Dün',
    this_week: 'Bu Hafta',
    last_week: 'Geçen Hafta',
    this_month: 'Bu Ay',
    last_month: 'Geçen Ay',
    last_30_days: 'Son 30 Gün',
    last_90_days: 'Son 90 Gün',
    custom: `${formatDate(startDate)} - ${formatDate(endDate)}`
  }
  return labels[preset]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function getMonthShort(month: number): string {
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return months[month]
}

function normalizeSource(referrer: string): string {
  if (!referrer || referrer === 'direct') return 'direct'
  const lower = referrer.toLowerCase()
  if (lower.includes('google')) return 'google'
  if (lower.includes('instagram')) return 'instagram'
  if (lower.includes('facebook')) return 'facebook'
  if (lower.includes('tiktok')) return 'tiktok'
  if (lower.includes('twitter') || lower.includes('x.com')) return 'twitter'
  if (lower.includes('mail') || lower.includes('email')) return 'email'
  return 'referral'
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    direct: 'Direkt',
    google: 'Google',
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    twitter: 'Twitter/X',
    email: 'Email',
    referral: 'Referans',
    other: 'Diğer'
  }
  return labels[source] || source
}
