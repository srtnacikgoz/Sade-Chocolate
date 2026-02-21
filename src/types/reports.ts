// src/types/reports.ts
// Rapor Export Sistemi Types
// SaaS-Dostu: Config-driven, multi-tenant ready

// =====================================================
// REPORT TYPES
// =====================================================

export type ReportType = 'orders' | 'customers' | 'sales' | 'inventory' | 'rfm' | 'clv'

export type ExportFormat = 'xlsx' | 'csv'

// =====================================================
// REPORT DEFINITIONS
// =====================================================

export type ReportDefinition = {
  id: ReportType
  name: { tr: string; en: string }
  description: { tr: string; en: string }
  icon: string
  supportedFormats: ExportFormat[]
  fields: ReportField[]
  defaultDateRange: boolean  // Tarih filtresi gerekli mi
}

export type ReportField = {
  key: string
  label: { tr: string; en: string }
  type: 'string' | 'number' | 'currency' | 'date' | 'boolean' | 'array'
  width?: number  // Excel kolon genişliği
  format?: string // Özel format (tarih, para birimi vs)
}

// =====================================================
// EXPORT REQUEST & RESULT
// =====================================================

export type ExportRequest = {
  reportType: ReportType
  format: ExportFormat
  dateRange?: {
    startDate: string
    endDate: string
  }
  filters?: Record<string, any>
  columns?: string[]  // Seçili kolonlar (boşsa tümü)
}

export type ExportResult = {
  success: boolean
  filename: string
  recordCount: number
  fileSize?: number
  downloadUrl?: string
  error?: string
}

// =====================================================
// REPORT CONFIG
// =====================================================

export type ReportConfig = {
  // Feature flag
  enabled: boolean

  // İzin verilen rapor tipleri
  allowedReports: ReportType[]

  // İzin verilen formatlar
  allowedFormats: ExportFormat[]

  // Maksimum kayıt sayısı (performans için)
  maxRecordsPerExport: number

  // Meta
  updatedAt: string
  updatedBy: string | null
}

// =====================================================
// DEFAULT CONFIG
// =====================================================

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  enabled: true,
  allowedReports: ['orders', 'customers', 'sales', 'inventory', 'rfm', 'clv'],
  allowedFormats: ['xlsx', 'csv'],
  maxRecordsPerExport: 10000,
  updatedAt: new Date().toISOString(),
  updatedBy: null
}

// =====================================================
// REPORT DEFINITIONS
// =====================================================

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'orders',
    name: { tr: 'Sipariş Raporu', en: 'Orders Report' },
    description: { tr: 'Tüm siparişlerin detaylı listesi', en: 'Detailed list of all orders' },
    icon: 'shopping-cart',
    supportedFormats: ['xlsx', 'csv'],
    defaultDateRange: true,
    fields: [
      { key: 'orderNumber', label: { tr: 'Sipariş No', en: 'Order No' }, type: 'string', width: 15 },
      { key: 'createdAt', label: { tr: 'Tarih', en: 'Date' }, type: 'date', width: 12 },
      { key: 'customerName', label: { tr: 'Müşteri', en: 'Customer' }, type: 'string', width: 25 },
      { key: 'customerEmail', label: { tr: 'Email', en: 'Email' }, type: 'string', width: 30 },
      { key: 'customerPhone', label: { tr: 'Telefon', en: 'Phone' }, type: 'string', width: 15 },
      { key: 'status', label: { tr: 'Durum', en: 'Status' }, type: 'string', width: 12 },
      { key: 'itemCount', label: { tr: 'Ürün Sayısı', en: 'Item Count' }, type: 'number', width: 10 },
      { key: 'subtotal', label: { tr: 'Ara Toplam', en: 'Subtotal' }, type: 'currency', width: 12 },
      { key: 'shippingCost', label: { tr: 'Kargo', en: 'Shipping' }, type: 'currency', width: 10 },
      { key: 'discount', label: { tr: 'İndirim', en: 'Discount' }, type: 'currency', width: 10 },
      { key: 'total', label: { tr: 'Toplam', en: 'Total' }, type: 'currency', width: 12 },
      { key: 'paymentMethod', label: { tr: 'Ödeme Yöntemi', en: 'Payment Method' }, type: 'string', width: 15 },
      { key: 'shippingCity', label: { tr: 'Şehir', en: 'City' }, type: 'string', width: 15 },
      { key: 'trackingNumber', label: { tr: 'Takip No', en: 'Tracking No' }, type: 'string', width: 20 }
    ]
  },
  {
    id: 'customers',
    name: { tr: 'Müşteri Raporu', en: 'Customers Report' },
    description: { tr: 'Müşteri listesi ve istatistikleri', en: 'Customer list and statistics' },
    icon: 'users',
    supportedFormats: ['xlsx', 'csv'],
    defaultDateRange: false,
    fields: [
      { key: 'name', label: { tr: 'Ad Soyad', en: 'Name' }, type: 'string', width: 25 },
      { key: 'email', label: { tr: 'Email', en: 'Email' }, type: 'string', width: 30 },
      { key: 'phone', label: { tr: 'Telefon', en: 'Phone' }, type: 'string', width: 15 },
      { key: 'totalOrders', label: { tr: 'Sipariş Sayısı', en: 'Total Orders' }, type: 'number', width: 12 },
      { key: 'totalSpent', label: { tr: 'Toplam Harcama', en: 'Total Spent' }, type: 'currency', width: 15 },
      { key: 'avgOrderValue', label: { tr: 'Ort. Sepet', en: 'Avg Order' }, type: 'currency', width: 12 },
      { key: 'firstOrderDate', label: { tr: 'İlk Sipariş', en: 'First Order' }, type: 'date', width: 12 },
      { key: 'lastOrderDate', label: { tr: 'Son Sipariş', en: 'Last Order' }, type: 'date', width: 12 },
      { key: 'city', label: { tr: 'Şehir', en: 'City' }, type: 'string', width: 15 },
      { key: 'isNewsletter', label: { tr: 'Bülten', en: 'Newsletter' }, type: 'boolean', width: 8 },
      { key: 'createdAt', label: { tr: 'Kayıt Tarihi', en: 'Registered' }, type: 'date', width: 12 }
    ]
  },
  {
    id: 'sales',
    name: { tr: 'Satış Raporu', en: 'Sales Report' },
    description: { tr: 'Günlük/aylık satış özeti', en: 'Daily/monthly sales summary' },
    icon: 'trending-up',
    supportedFormats: ['xlsx', 'csv'],
    defaultDateRange: true,
    fields: [
      { key: 'date', label: { tr: 'Tarih', en: 'Date' }, type: 'date', width: 12 },
      { key: 'orderCount', label: { tr: 'Sipariş Sayısı', en: 'Order Count' }, type: 'number', width: 12 },
      { key: 'revenue', label: { tr: 'Gelir', en: 'Revenue' }, type: 'currency', width: 15 },
      { key: 'avgOrderValue', label: { tr: 'Ort. Sepet', en: 'AOV' }, type: 'currency', width: 12 },
      { key: 'itemsSold', label: { tr: 'Satılan Ürün', en: 'Items Sold' }, type: 'number', width: 12 },
      { key: 'newCustomers', label: { tr: 'Yeni Müşteri', en: 'New Customers' }, type: 'number', width: 12 },
      { key: 'returningCustomers', label: { tr: 'Tekrar Müşteri', en: 'Returning' }, type: 'number', width: 12 },
      { key: 'shippingRevenue', label: { tr: 'Kargo Geliri', en: 'Shipping Revenue' }, type: 'currency', width: 12 },
      { key: 'discountGiven', label: { tr: 'Verilen İndirim', en: 'Discounts' }, type: 'currency', width: 12 }
    ]
  },
  {
    id: 'inventory',
    name: { tr: 'Stok Raporu', en: 'Inventory Report' },
    description: { tr: 'Ürün stok durumu', en: 'Product stock status' },
    icon: 'package',
    supportedFormats: ['xlsx', 'csv'],
    defaultDateRange: false,
    fields: [
      { key: 'sku', label: { tr: 'SKU', en: 'SKU' }, type: 'string', width: 15 },
      { key: 'name', label: { tr: 'Ürün Adı', en: 'Product Name' }, type: 'string', width: 35 },
      { key: 'category', label: { tr: 'Kategori', en: 'Category' }, type: 'string', width: 15 },
      { key: 'price', label: { tr: 'Fiyat', en: 'Price' }, type: 'currency', width: 12 },
      { key: 'stock', label: { tr: 'Stok', en: 'Stock' }, type: 'number', width: 10 },
      { key: 'lowStockThreshold', label: { tr: 'Min. Stok', en: 'Min Stock' }, type: 'number', width: 10 },
      { key: 'status', label: { tr: 'Durum', en: 'Status' }, type: 'string', width: 12 },
      { key: 'soldCount', label: { tr: 'Satılan', en: 'Sold' }, type: 'number', width: 10 },
      { key: 'lastSoldAt', label: { tr: 'Son Satış', en: 'Last Sold' }, type: 'date', width: 12 }
    ]
  },
  {
    id: 'rfm',
    name: { tr: 'RFM Segment Raporu', en: 'RFM Segment Report' },
    description: { tr: 'Müşteri RFM segmentasyonu', en: 'Customer RFM segmentation' },
    icon: 'users',
    supportedFormats: ['xlsx', 'csv'],
    defaultDateRange: false,
    fields: [
      { key: 'customerEmail', label: { tr: 'Email', en: 'Email' }, type: 'string', width: 30 },
      { key: 'customerName', label: { tr: 'Müşteri', en: 'Customer' }, type: 'string', width: 25 },
      { key: 'segmentName', label: { tr: 'Segment', en: 'Segment' }, type: 'string', width: 15 },
      { key: 'recencyScore', label: { tr: 'R Skor', en: 'R Score' }, type: 'number', width: 8 },
      { key: 'frequencyScore', label: { tr: 'F Skor', en: 'F Score' }, type: 'number', width: 8 },
      { key: 'monetaryScore', label: { tr: 'M Skor', en: 'M Score' }, type: 'number', width: 8 },
      { key: 'totalScore', label: { tr: 'Toplam', en: 'Total' }, type: 'number', width: 8 },
      { key: 'recencyDays', label: { tr: 'Son Alışveriş (Gün)', en: 'Days Since' }, type: 'number', width: 15 },
      { key: 'frequency', label: { tr: 'Sipariş Sayısı', en: 'Orders' }, type: 'number', width: 12 },
      { key: 'monetary', label: { tr: 'Toplam Harcama', en: 'Total Spent' }, type: 'currency', width: 15 }
    ]
  },
  {
    id: 'clv',
    name: { tr: 'CLV Raporu', en: 'CLV Report' },
    description: { tr: 'Müşteri yaşam boyu değeri', en: 'Customer lifetime value' },
    icon: 'dollar-sign',
    supportedFormats: ['xlsx', 'csv'],
    defaultDateRange: false,
    fields: [
      { key: 'customerEmail', label: { tr: 'Email', en: 'Email' }, type: 'string', width: 30 },
      { key: 'customerName', label: { tr: 'Müşteri', en: 'Customer' }, type: 'string', width: 25 },
      { key: 'tierName', label: { tr: 'Tier', en: 'Tier' }, type: 'string', width: 12 },
      { key: 'totalCLV', label: { tr: 'Toplam CLV', en: 'Total CLV' }, type: 'currency', width: 15 },
      { key: 'historicalCLV', label: { tr: 'Geçmiş CLV', en: 'Historical CLV' }, type: 'currency', width: 15 },
      { key: 'predictedCLV', label: { tr: 'Tahmini CLV', en: 'Predicted CLV' }, type: 'currency', width: 15 },
      { key: 'totalRevenue', label: { tr: 'Toplam Gelir', en: 'Total Revenue' }, type: 'currency', width: 15 },
      { key: 'totalOrders', label: { tr: 'Sipariş Sayısı', en: 'Orders' }, type: 'number', width: 12 },
      { key: 'avgOrderValue', label: { tr: 'Ort. Sepet', en: 'AOV' }, type: 'currency', width: 12 },
      { key: 'clvTrend', label: { tr: 'Trend', en: 'Trend' }, type: 'string', width: 10 }
    ]
  }
]

// =====================================================
// HELPER: Rapor tanımını getir
// =====================================================

export function getReportDefinition(reportType: ReportType): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find(r => r.id === reportType)
}

// =====================================================
// STATUS LABELS (Türkçe çeviri için)
// =====================================================

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  preparing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
  refunded: 'İade'
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  iyzico: 'Kredi Kartı',
  bank_transfer: 'Havale/EFT',
  cash_on_delivery: 'Kapıda Ödeme'
}

// =====================================================
// DATE RANGE PRESETS (Tarih aralığı seçenekleri)
// =====================================================

export const DATE_RANGE_PRESETS = [
  { id: 'today', label: 'Bugün' },
  { id: 'yesterday', label: 'Dün' },
  { id: 'last_7_days', label: 'Son 7 Gün' },
  { id: 'this_week', label: 'Bu Hafta' },
  { id: 'last_week', label: 'Geçen Hafta' },
  { id: 'this_month', label: 'Bu Ay' },
  { id: 'last_month', label: 'Geçen Ay' },
  { id: 'last_30_days', label: 'Son 30 Gün' },
  { id: 'last_90_days', label: 'Son 90 Gün' },
  { id: 'this_year', label: 'Bu Yıl' },
  { id: 'custom', label: 'Özel Tarih' }
] as const
