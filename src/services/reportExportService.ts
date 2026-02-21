// src/services/reportExportService.ts
// Rapor Export Service
// SaaS-Dostu: Config-driven, multi-format support

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
  limit
} from 'firebase/firestore'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  ReportConfig,
  ReportType,
  ExportFormat,
  ExportRequest,
  ExportResult,
  ReportDefinition,
  ReportField,
  DEFAULT_REPORT_CONFIG,
  REPORT_DEFINITIONS,
  getReportDefinition,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS
} from '../types/reports'

// =====================================================
// CONFIG MANAGEMENT
// =====================================================

/**
 * Rapor konfigürasyonunu getir
 */
export async function getReportConfig(): Promise<ReportConfig> {
  try {
    const configRef = doc(db, 'settings', 'report_config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      return configSnap.data() as ReportConfig
    }

    await setDoc(configRef, DEFAULT_REPORT_CONFIG)
    return DEFAULT_REPORT_CONFIG
  } catch (error) {
    console.error('Report config yüklenemedi:', error)
    return DEFAULT_REPORT_CONFIG
  }
}

/**
 * Rapor konfigürasyonunu güncelle
 */
export async function updateReportConfig(
  updates: Partial<ReportConfig>,
  updatedBy?: string
): Promise<void> {
  try {
    const configRef = doc(db, 'settings', 'report_config')
    await setDoc(configRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || null
    }, { merge: true })
  } catch (error) {
    console.error('Report config güncellenemedi:', error)
    throw error
  }
}

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

/**
 * Ana export fonksiyonu
 */
export async function exportReport(request: ExportRequest): Promise<ExportResult> {
  const config = await getReportConfig()

  // Validasyon
  if (!config.enabled) {
    return { success: false, filename: '', recordCount: 0, error: 'Rapor sistemi devre dışı' }
  }

  if (!config.allowedReports.includes(request.reportType)) {
    return { success: false, filename: '', recordCount: 0, error: 'Bu rapor tipi izin verilmiyor' }
  }

  if (!config.allowedFormats.includes(request.format)) {
    return { success: false, filename: '', recordCount: 0, error: 'Bu format izin verilmiyor' }
  }

  const definition = getReportDefinition(request.reportType)
  if (!definition) {
    return { success: false, filename: '', recordCount: 0, error: 'Rapor tanımı bulunamadı' }
  }

  try {
    // Veri çek
    const data = await fetchReportData(request, config.maxRecordsPerExport)

    if (data.length === 0) {
      return { success: false, filename: '', recordCount: 0, error: 'Veri bulunamadı' }
    }

    // Dosya adı oluştur
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `${definition.name.tr.replace(/\s+/g, '_')}_${timestamp}.${request.format}`

    // Export
    if (request.format === 'xlsx') {
      await exportToExcel(data, definition, filename, request.columns)
    } else {
      await exportToCSV(data, definition, filename, request.columns)
    }

    return {
      success: true,
      filename,
      recordCount: data.length
    }
  } catch (error: any) {
    console.error('Export hatası:', error)
    return { success: false, filename: '', recordCount: 0, error: error.message || 'Export sırasında hata oluştu' }
  }
}

// =====================================================
// DATA FETCHING
// =====================================================

async function fetchReportData(
  request: ExportRequest,
  maxRecords: number
): Promise<any[]> {
  switch (request.reportType) {
    case 'orders':
      return fetchOrdersData(request, maxRecords)
    case 'customers':
      return fetchCustomersData(request, maxRecords)
    case 'sales':
      return fetchSalesData(request, maxRecords)
    case 'inventory':
      return fetchInventoryData(request, maxRecords)
    case 'rfm':
      return fetchRFMData(request, maxRecords)
    case 'clv':
      return fetchCLVData(request, maxRecords)
    default:
      return []
  }
}

async function fetchOrdersData(request: ExportRequest, maxRecords: number): Promise<any[]> {
  const ordersRef = collection(db, 'orders')
  let q = query(ordersRef, orderBy('createdAt', 'desc'), limit(maxRecords))

  if (request.dateRange) {
    q = query(
      ordersRef,
      where('createdAt', '>=', request.dateRange.startDate),
      where('createdAt', '<=', request.dateRange.endDate),
      orderBy('createdAt', 'desc'),
      limit(maxRecords)
    )
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      orderNumber: data.orderNumber || doc.id,
      createdAt: formatDate(data.createdAt),
      customerName: data.customer?.name || data.customerName || '-',
      customerEmail: data.customer?.email || data.customerEmail || '-',
      customerPhone: data.customer?.phone || data.customerPhone || '-',
      status: ORDER_STATUS_LABELS[data.status] || data.status,
      itemCount: data.items?.length || 0,
      subtotal: data.subtotal || 0,
      shippingCost: data.shippingCost || 0,
      discount: data.discount || 0,
      total: data.total || 0,
      paymentMethod: PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod || '-',
      shippingCity: data.shippingAddress?.city || '-',
      trackingNumber: data.trackingNumber || '-'
    }
  })
}

async function fetchCustomersData(request: ExportRequest, maxRecords: number): Promise<any[]> {
  const customersRef = collection(db, 'customers')
  const q = query(customersRef, orderBy('totalSpent', 'desc'), limit(maxRecords))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => {
    const data = doc.data()
    const avgOrder = data.totalOrders > 0 ? (data.totalSpent || 0) / data.totalOrders : 0
    return {
      name: data.name || '-',
      email: data.email || '-',
      phone: data.phone || '-',
      totalOrders: data.totalOrders || 0,
      totalSpent: data.totalSpent || 0,
      avgOrderValue: Math.round(avgOrder),
      firstOrderDate: formatDate(data.firstOrderDate),
      lastOrderDate: formatDate(data.lastOrderDate),
      city: data.defaultAddress?.city || '-',
      isNewsletter: data.newsletter ? 'Evet' : 'Hayır',
      createdAt: formatDate(data.createdAt)
    }
  })
}

async function fetchSalesData(request: ExportRequest, maxRecords: number): Promise<any[]> {
  if (!request.dateRange) {
    // Son 30 gün default
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    request.dateRange = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

  const ordersRef = collection(db, 'orders')
  const q = query(
    ordersRef,
    where('createdAt', '>=', request.dateRange.startDate),
    where('createdAt', '<=', request.dateRange.endDate),
    orderBy('createdAt', 'asc')
  )
  const snapshot = await getDocs(q)
  const orders = snapshot.docs.map(doc => doc.data())

  // Günlük grupla
  const dailyData: Record<string, {
    orderCount: number
    revenue: number
    itemsSold: number
    newCustomers: Set<string>
    returningCustomers: Set<string>
    shippingRevenue: number
    discountGiven: number
  }> = {}

  // Mevcut müşteriler (returning tespiti için)
  const existingCustomers = new Set<string>()

  orders.forEach(order => {
    if (order.status === 'cancelled') return

    const dateKey = order.createdAt.split('T')[0]
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        orderCount: 0,
        revenue: 0,
        itemsSold: 0,
        newCustomers: new Set(),
        returningCustomers: new Set(),
        shippingRevenue: 0,
        discountGiven: 0
      }
    }

    const day = dailyData[dateKey]
    const customerId = order.customerId || order.customer?.email

    day.orderCount++
    day.revenue += order.total || 0
    day.itemsSold += order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0
    day.shippingRevenue += order.shippingCost || 0
    day.discountGiven += order.discount || 0

    if (customerId) {
      if (existingCustomers.has(customerId)) {
        day.returningCustomers.add(customerId)
      } else {
        day.newCustomers.add(customerId)
        existingCustomers.add(customerId)
      }
    }
  })

  return Object.entries(dailyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date: formatDate(date),
      orderCount: data.orderCount,
      revenue: data.revenue,
      avgOrderValue: data.orderCount > 0 ? Math.round(data.revenue / data.orderCount) : 0,
      itemsSold: data.itemsSold,
      newCustomers: data.newCustomers.size,
      returningCustomers: data.returningCustomers.size,
      shippingRevenue: data.shippingRevenue,
      discountGiven: data.discountGiven
    }))
}

async function fetchInventoryData(request: ExportRequest, maxRecords: number): Promise<any[]> {
  const productsRef = collection(db, 'products')
  const q = query(productsRef, limit(maxRecords))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => {
    const data = doc.data()
    const stock = data.stock || 0
    const lowThreshold = data.lowStockThreshold || 10
    let status = 'Normal'
    if (stock === 0) status = 'Tükendi'
    else if (stock <= lowThreshold) status = 'Düşük Stok'

    return {
      sku: data.sku || doc.id.slice(0, 8),
      name: data.name || '-',
      category: data.category || '-',
      price: data.price || 0,
      stock: stock,
      lowStockThreshold: lowThreshold,
      status,
      soldCount: data.soldCount || 0,
      lastSoldAt: formatDate(data.lastSoldAt)
    }
  })
}

async function fetchRFMData(request: ExportRequest, maxRecords: number): Promise<any[]> {
  const rfmRef = collection(db, 'customer_rfm')
  const q = query(rfmRef, orderBy('monetary', 'desc'), limit(maxRecords))
  const snapshot = await getDocs(q)

  // Segment isimleri için config'den al
  const configRef = doc(db, 'settings', 'rfm_config')
  const configSnap = await getDoc(configRef)
  const segments = configSnap.exists() ? configSnap.data().segments || [] : []
  const segmentNames: Record<string, string> = {}
  segments.forEach((s: any) => {
    segmentNames[s.id] = s.name?.tr || s.id
  })

  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      customerEmail: data.customerEmail || '-',
      customerName: data.customerName || '-',
      segmentName: segmentNames[data.segmentId] || data.segmentId,
      recencyScore: data.recencyScore || 0,
      frequencyScore: data.frequencyScore || 0,
      monetaryScore: data.monetaryScore || 0,
      totalScore: data.totalScore || 0,
      recencyDays: data.recencyDays || 0,
      frequency: data.frequency || 0,
      monetary: data.monetary || 0
    }
  })
}

async function fetchCLVData(request: ExportRequest, maxRecords: number): Promise<any[]> {
  const clvRef = collection(db, 'customer_clv')
  const q = query(clvRef, orderBy('totalCLV', 'desc'), limit(maxRecords))
  const snapshot = await getDocs(q)

  const trendLabels: Record<string, string> = {
    increasing: 'Artıyor',
    stable: 'Stabil',
    decreasing: 'Azalıyor'
  }

  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      customerEmail: data.customerEmail || '-',
      customerName: data.customerName || '-',
      tierName: data.tierName || '-',
      totalCLV: data.totalCLV || 0,
      historicalCLV: data.historicalCLV || 0,
      predictedCLV: data.predictedCLV || 0,
      totalRevenue: data.totalRevenue || 0,
      totalOrders: data.totalOrders || 0,
      avgOrderValue: data.avgOrderValue || 0,
      clvTrend: trendLabels[data.clvTrend] || data.clvTrend || '-'
    }
  })
}

// =====================================================
// EXCEL EXPORT
// =====================================================

async function exportToExcel(
  data: any[],
  definition: ReportDefinition,
  filename: string,
  selectedColumns?: string[]
): Promise<void> {
  // Kullanılacak alanları belirle
  const fields = selectedColumns
    ? definition.fields.filter(f => selectedColumns.includes(f.key))
    : definition.fields

  // Header oluştur
  const headers = fields.map(f => f.label.tr)

  // Veriyi dönüştür
  const rows = data.map(row => {
    return fields.map(field => {
      const value = row[field.key]
      if (field.type === 'currency') {
        return typeof value === 'number' ? value : 0
      }
      return value ?? ''
    })
  })

  // Worksheet oluştur
  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Kolon genişlikleri
  ws['!cols'] = fields.map(f => ({ wch: f.width || 15 }))

  // Currency formatı
  fields.forEach((field, colIndex) => {
    if (field.type === 'currency') {
      // Her satırda para birimi formatı
      for (let rowIndex = 1; rowIndex <= rows.length; rowIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
        if (ws[cellRef]) {
          ws[cellRef].z = '#,##0 ₺'
        }
      }
    }
  })

  // Workbook oluştur
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, definition.name.tr.slice(0, 31))

  // İndir
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}

// =====================================================
// CSV EXPORT
// =====================================================

async function exportToCSV(
  data: any[],
  definition: ReportDefinition,
  filename: string,
  selectedColumns?: string[]
): Promise<void> {
  const fields = selectedColumns
    ? definition.fields.filter(f => selectedColumns.includes(f.key))
    : definition.fields

  // Header
  const headers = fields.map(f => `"${f.label.tr}"`).join(';')

  // Rows
  const rows = data.map(row => {
    return fields.map(field => {
      let value = row[field.key]
      if (value === null || value === undefined) value = ''
      if (typeof value === 'string') {
        value = `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(';')
  })

  // BOM for Excel UTF-8 support
  const BOM = '\uFEFF'
  const csvContent = BOM + headers + '\n' + rows.join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, filename)
}

// =====================================================
// HELPERS
// =====================================================

function formatDate(dateValue: any): string {
  if (!dateValue) return '-'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('tr-TR')
  } catch {
    return '-'
  }
}
