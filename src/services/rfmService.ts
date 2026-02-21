// src/services/rfmService.ts
// RFM Müşteri Segmentasyonu Servisi
// SaaS-Dostu: Config-driven, multi-tenant ready

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
  RFMConfig,
  CustomerRFM,
  RFMDashboardData,
  RFMSegmentStats,
  CustomerSegmentId,
  DEFAULT_RFM_CONFIG,
  CLVConfig,
  CustomerCLV,
  CLVDashboardData,
  DEFAULT_CLV_CONFIG,
  CohortConfig,
  CohortDashboardData,
  CohortGroup,
  DEFAULT_COHORT_CONFIG
} from '../types/rfm'

// =====================================================
// CONFIG MANAGEMENT
// =====================================================

/**
 * RFM konfigürasyonunu getir
 * Firestore'da yoksa default değerleri döner
 */
export async function getRFMConfig(): Promise<RFMConfig> {
  try {
    const configRef = doc(db, 'settings', 'rfm_config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      return configSnap.data() as RFMConfig
    }

    // İlk kez - default config'i kaydet
    await setDoc(configRef, DEFAULT_RFM_CONFIG)
    return DEFAULT_RFM_CONFIG
  } catch (error) {
    console.error('RFM config yüklenemedi:', error)
    return DEFAULT_RFM_CONFIG
  }
}

/**
 * RFM konfigürasyonunu güncelle
 */
export async function updateRFMConfig(
  updates: Partial<RFMConfig>,
  updatedBy?: string
): Promise<void> {
  try {
    const configRef = doc(db, 'settings', 'rfm_config')
    await setDoc(configRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || null
    }, { merge: true })
  } catch (error) {
    console.error('RFM config güncellenemedi:', error)
    throw error
  }
}

// =====================================================
// CUSTOMER RFM DATA
// =====================================================

/**
 * Tüm müşterilerin RFM verilerini getir
 */
export async function getAllCustomerRFM(): Promise<CustomerRFM[]> {
  try {
    const rfmRef = collection(db, 'customer_rfm')
    const snapshot = await getDocs(rfmRef)

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      customerId: doc.id
    })) as CustomerRFM[]
  } catch (error) {
    console.error('Customer RFM verileri yüklenemedi:', error)
    return []
  }
}

/**
 * Belirli segment'teki müşterileri getir
 */
export async function getCustomersBySegment(
  segmentId: CustomerSegmentId,
  limitCount: number = 100
): Promise<CustomerRFM[]> {
  try {
    const rfmRef = collection(db, 'customer_rfm')
    const q = query(
      rfmRef,
      where('segmentId', '==', segmentId),
      orderBy('monetary', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      customerId: doc.id
    })) as CustomerRFM[]
  } catch (error) {
    console.error(`Segment ${segmentId} müşterileri yüklenemedi:`, error)
    return []
  }
}

/**
 * Tek müşterinin RFM verisini getir
 */
export async function getCustomerRFM(customerId: string): Promise<CustomerRFM | null> {
  try {
    const rfmRef = doc(db, 'customer_rfm', customerId)
    const rfmSnap = await getDoc(rfmRef)

    if (rfmSnap.exists()) {
      return { ...rfmSnap.data(), customerId } as CustomerRFM
    }
    return null
  } catch (error) {
    console.error(`Customer ${customerId} RFM verisi yüklenemedi:`, error)
    return null
  }
}

// =====================================================
// DASHBOARD DATA
// =====================================================

/**
 * RFM Dashboard verilerini getir
 */
export async function getRFMDashboardData(): Promise<RFMDashboardData | null> {
  try {
    // Önce cache'lenmiş dashboard verisini kontrol et
    const dashboardRef = doc(db, 'analytics', 'rfm_dashboard')
    const dashboardSnap = await getDoc(dashboardRef)

    if (dashboardSnap.exists()) {
      return dashboardSnap.data() as RFMDashboardData
    }

    // Cache yoksa hesapla
    return await calculateRFMDashboard()
  } catch (error) {
    console.error('RFM Dashboard verisi yüklenemedi:', error)
    return null
  }
}

/**
 * RFM Dashboard verilerini hesapla (client-side fallback)
 */
async function calculateRFMDashboard(): Promise<RFMDashboardData> {
  const customers = await getAllCustomerRFM()
  const config = await getRFMConfig()

  // Segment bazlı istatistikler
  const segmentStats: RFMSegmentStats[] = config.segments.map(segment => {
    const segmentCustomers = customers.filter(c => c.segmentId === segment.id)
    const totalRevenue = segmentCustomers.reduce((sum, c) => sum + c.monetary, 0)
    const totalFrequency = segmentCustomers.reduce((sum, c) => sum + c.frequency, 0)

    return {
      segmentId: segment.id,
      customerCount: segmentCustomers.length,
      totalRevenue,
      avgOrderValue: segmentCustomers.length > 0
        ? totalRevenue / totalFrequency
        : 0,
      avgFrequency: segmentCustomers.length > 0
        ? totalFrequency / segmentCustomers.length
        : 0,
      percentageOfTotal: customers.length > 0
        ? (segmentCustomers.length / customers.length) * 100
        : 0
    }
  })

  // Son segment geçişleri
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentTransitions = customers
    .filter(c =>
      c.previousSegmentId &&
      c.segmentChangedAt &&
      new Date(c.segmentChangedAt) > thirtyDaysAgo
    )
    .map(c => ({
      customerId: c.customerId,
      customerEmail: c.customerEmail,
      fromSegment: c.previousSegmentId!,
      toSegment: c.segmentId,
      changedAt: c.segmentChangedAt!
    }))
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    .slice(0, 20)

  return {
    totalCustomers: customers.length,
    customersWithRFM: customers.filter(c => c.frequency > 0).length,
    segmentStats,
    calculatedAt: new Date().toISOString(),
    recentTransitions
  }
}

// =====================================================
// SEGMENT HELPERS
// =====================================================

/**
 * Segment rengini Tailwind class'ına çevir
 */
export function getSegmentColorClass(color: string, type: 'bg' | 'text' | 'border' = 'bg'): string {
  const colorMap: Record<string, Record<string, string>> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
  }

  return colorMap[color]?.[type] || `${type}-slate-100`
}

/**
 * Segment önceliğine göre sırala
 */
export function sortSegmentsByPriority(
  segments: { id: CustomerSegmentId; priority?: number }[]
): typeof segments {
  return [...segments].sort((a, b) => (a.priority || 99) - (b.priority || 99))
}

// =====================================================
// CLV (Customer Lifetime Value) FUNCTIONS
// =====================================================

/**
 * CLV konfigürasyonunu getir
 */
export async function getCLVConfig(): Promise<CLVConfig> {
  try {
    const configRef = doc(db, 'settings', 'clv_config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      return configSnap.data() as CLVConfig
    }

    // İlk kez - default config'i kaydet
    await setDoc(configRef, DEFAULT_CLV_CONFIG)
    return DEFAULT_CLV_CONFIG
  } catch (error) {
    console.error('CLV config yüklenemedi:', error)
    return DEFAULT_CLV_CONFIG
  }
}

/**
 * CLV konfigürasyonunu güncelle
 */
export async function updateCLVConfig(
  updates: Partial<CLVConfig>,
  updatedBy?: string
): Promise<void> {
  try {
    const configRef = doc(db, 'settings', 'clv_config')
    await setDoc(configRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || null
    }, { merge: true })
  } catch (error) {
    console.error('CLV config güncellenemedi:', error)
    throw error
  }
}

/**
 * Tüm müşterilerin CLV verilerini getir
 */
export async function getAllCustomerCLV(): Promise<CustomerCLV[]> {
  try {
    const clvRef = collection(db, 'customer_clv')
    const snapshot = await getDocs(clvRef)

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      customerId: doc.id
    })) as CustomerCLV[]
  } catch (error) {
    console.error('Customer CLV verileri yüklenemedi:', error)
    return []
  }
}

/**
 * Tek müşterinin CLV verisini getir
 */
export async function getCustomerCLV(customerId: string): Promise<CustomerCLV | null> {
  try {
    const clvRef = doc(db, 'customer_clv', customerId)
    const clvSnap = await getDoc(clvRef)

    if (clvSnap.exists()) {
      return { ...clvSnap.data(), customerId } as CustomerCLV
    }
    return null
  } catch (error) {
    console.error(`Customer ${customerId} CLV verisi yüklenemedi:`, error)
    return null
  }
}

/**
 * CLV Dashboard verilerini getir
 */
export async function getCLVDashboardData(): Promise<CLVDashboardData | null> {
  try {
    const dashboardRef = doc(db, 'analytics', 'clv_dashboard')
    const dashboardSnap = await getDoc(dashboardRef)

    if (dashboardSnap.exists()) {
      return dashboardSnap.data() as CLVDashboardData
    }

    return null
  } catch (error) {
    console.error('CLV Dashboard verisi yüklenemedi:', error)
    return null
  }
}

/**
 * Top CLV müşterilerini getir
 */
export async function getTopCLVCustomers(limitCount: number = 20): Promise<CustomerCLV[]> {
  try {
    const clvRef = collection(db, 'customer_clv')
    const q = query(
      clvRef,
      orderBy('totalCLV', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      customerId: doc.id
    })) as CustomerCLV[]
  } catch (error) {
    console.error('Top CLV müşterileri yüklenemedi:', error)
    return []
  }
}

/**
 * CLV Tier rengini Tailwind class'ına çevir
 */
export function getCLVTierColorClass(color: string, type: 'bg' | 'text' | 'border' = 'bg'): string {
  const colorMap: Record<string, Record<string, string>> = {
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    slate: { bg: 'bg-slate-200', text: 'text-slate-700', border: 'border-slate-400' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-400' }
  }

  return colorMap[color]?.[type] || `${type}-slate-100`
}

// =====================================================
// COHORT ANALYSIS FUNCTIONS
// =====================================================

/**
 * Cohort konfigürasyonunu getir
 */
export async function getCohortConfig(): Promise<CohortConfig> {
  try {
    const configRef = doc(db, 'settings', 'cohort_config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      return configSnap.data() as CohortConfig
    }

    // İlk kez - default config'i kaydet
    await setDoc(configRef, DEFAULT_COHORT_CONFIG)
    return DEFAULT_COHORT_CONFIG
  } catch (error) {
    console.error('Cohort config yüklenemedi:', error)
    return DEFAULT_COHORT_CONFIG
  }
}

/**
 * Cohort konfigürasyonunu güncelle
 */
export async function updateCohortConfig(
  updates: Partial<CohortConfig>,
  updatedBy?: string
): Promise<void> {
  try {
    const configRef = doc(db, 'settings', 'cohort_config')
    await setDoc(configRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || null
    }, { merge: true })
  } catch (error) {
    console.error('Cohort config güncellenemedi:', error)
    throw error
  }
}

/**
 * Cohort Dashboard verilerini getir
 */
export async function getCohortDashboardData(): Promise<CohortDashboardData | null> {
  try {
    const dashboardRef = doc(db, 'analytics', 'cohort_dashboard')
    const dashboardSnap = await getDoc(dashboardRef)

    if (dashboardSnap.exists()) {
      return dashboardSnap.data() as CohortDashboardData
    }

    return null
  } catch (error) {
    console.error('Cohort Dashboard verisi yüklenemedi:', error)
    return null
  }
}

/**
 * Tüm cohort gruplarını getir
 */
export async function getAllCohorts(): Promise<CohortGroup[]> {
  try {
    const cohortsRef = collection(db, 'cohort_data')
    const q = query(cohortsRef, orderBy('cohortStartDate', 'desc'), limit(24))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      cohortId: doc.id
    })) as CohortGroup[]
  } catch (error) {
    console.error('Cohort verileri yüklenemedi:', error)
    return []
  }
}

/**
 * Belirli bir cohort'u getir
 */
export async function getCohort(cohortId: string): Promise<CohortGroup | null> {
  try {
    const cohortRef = doc(db, 'cohort_data', cohortId)
    const cohortSnap = await getDoc(cohortRef)

    if (cohortSnap.exists()) {
      return { ...cohortSnap.data(), cohortId } as CohortGroup
    }
    return null
  } catch (error) {
    console.error(`Cohort ${cohortId} yüklenemedi:`, error)
    return null
  }
}

/**
 * Retention oranına göre renk döndür (heatmap için)
 */
export function getRetentionColor(
  rate: number | null,
  thresholds: { low: number; medium: number; high: number }
): { bg: string; text: string } {
  if (rate === null) {
    return { bg: 'bg-slate-100', text: 'text-slate-400' }
  }

  if (rate >= thresholds.high) {
    return { bg: 'bg-emerald-500', text: 'text-white' }
  } else if (rate >= thresholds.medium) {
    return { bg: 'bg-emerald-300', text: 'text-emerald-900' }
  } else if (rate >= thresholds.low) {
    return { bg: 'bg-amber-300', text: 'text-amber-900' }
  } else {
    return { bg: 'bg-red-400', text: 'text-white' }
  }
}

/**
 * Cohort ayını Türkçe label'a çevir
 */
export function getCohortMonthLabel(cohortId: string): string {
  const months: Record<string, string> = {
    '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
    '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
    '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
  }

  const [year, month] = cohortId.split('-')
  return `${months[month] || month} ${year}`
}
