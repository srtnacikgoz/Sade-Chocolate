// src/types/rfm.ts
// RFM (Recency, Frequency, Monetary) Müşteri Segmentasyonu
// SaaS-Dostu: Tüm eşikler ve segment tanımları config'den gelir

// =====================================================
// RFM SCORE TYPES
// =====================================================

export type RFMScore = 1 | 2 | 3 | 4 | 5

export type CustomerSegmentId =
  | 'champions'        // Şampiyonlar
  | 'loyal'           // Sadık Müşteriler
  | 'potential'       // Potansiyel Sadıklar
  | 'new'             // Yeni Müşteriler
  | 'at_risk'         // Risk Altında
  | 'hibernating'     // Uykuda
  | 'lost'            // Kaybedilmiş

// Müşteri RFM profili
export type CustomerRFM = {
  customerId: string
  customerEmail: string
  customerName: string | null

  // Ham değerler
  recencyDays: number        // Son alışverişten bu yana gün
  frequency: number          // Toplam sipariş sayısı
  monetary: number           // Toplam harcama (TL)

  // RFM skorları (1-5)
  recencyScore: RFMScore
  frequencyScore: RFMScore
  monetaryScore: RFMScore

  // Toplam skor ve segment
  totalScore: number         // 3-15 arası
  segmentId: CustomerSegmentId

  // Meta
  calculatedAt: string       // ISO date
  previousSegmentId: CustomerSegmentId | null
  segmentChangedAt: string | null
}

// =====================================================
// CONFIG TYPES (Firestore'dan gelir)
// =====================================================

// Segment tanımı - Admin panelden düzenlenebilir
export type SegmentDefinition = {
  id: CustomerSegmentId
  name: {
    tr: string
    en: string
  }
  description: {
    tr: string
    en: string
  }
  // RFM score ranges (min-max inclusive)
  rfmRanges: {
    recency: { min: RFMScore; max: RFMScore }
    frequency: { min: RFMScore; max: RFMScore }
    monetary: { min: RFMScore; max: RFMScore }
  }
  // Alternatif: Total score bazlı
  totalScoreRange?: { min: number; max: number }
  // UI
  color: string              // Tailwind color (emerald, amber, red, etc.)
  icon: string               // Material icon name
  priority: number           // Sıralama (düşük = önce)
  // Önerilen aksiyonlar
  suggestedActions: string[]
}

// RFM eşik konfigürasyonu - Admin panelden düzenlenebilir
export type RFMThresholds = {
  // Recency: Son alışverişten bu yana gün eşikleri
  // Örnek: [7, 30, 90, 180] → 0-7 gün = 5, 8-30 = 4, 31-90 = 3, 91-180 = 2, 180+ = 1
  recencyDays: number[]

  // Frequency: Sipariş sayısı eşikleri
  // Örnek: [1, 2, 4, 8] → 8+ = 5, 4-7 = 4, 2-3 = 3, 1 = 2, 0 = 1
  frequencyOrders: number[]

  // Monetary: Toplam harcama eşikleri (TL)
  // Örnek: [500, 1000, 2500, 5000] → 5000+ = 5, 2500-4999 = 4, etc.
  monetaryAmount: number[]
}

// Ana RFM konfigürasyonu
export type RFMConfig = {
  // Feature flag
  enabled: boolean

  // Hesaplama ayarları
  calculationSchedule: 'hourly' | 'daily' | 'weekly'
  lastCalculatedAt: string | null

  // Eşikler
  thresholds: RFMThresholds

  // Segment tanımları
  segments: SegmentDefinition[]

  // Bildirim ayarları
  notifyOnSegmentChange: boolean
  notifyChannels: ('telegram' | 'email')[]

  // Minimum sipariş sayısı (RFM hesaplaması için)
  minOrdersForRFM: number

  // Meta
  updatedAt: string
  updatedBy: string | null
}

// =====================================================
// DEFAULT CONFIG (Fallback - Firestore boşsa)
// =====================================================

export const DEFAULT_RFM_THRESHOLDS: RFMThresholds = {
  recencyDays: [7, 30, 90, 180],      // 0-7=5, 8-30=4, 31-90=3, 91-180=2, 180+=1
  frequencyOrders: [1, 2, 4, 8],       // 8+=5, 4-7=4, 2-3=3, 1=2, 0=1
  monetaryAmount: [500, 1000, 2500, 5000] // 5000+=5, 2500-4999=4, etc.
}

export const DEFAULT_SEGMENT_DEFINITIONS: SegmentDefinition[] = [
  {
    id: 'champions',
    name: { tr: 'Şampiyonlar', en: 'Champions' },
    description: {
      tr: 'En değerli müşterileriniz. Sık alışveriş yapan, yüksek harcayan VIP\'ler.',
      en: 'Your most valuable customers. Frequent buyers with high spending.'
    },
    rfmRanges: {
      recency: { min: 4, max: 5 },
      frequency: { min: 4, max: 5 },
      monetary: { min: 4, max: 5 }
    },
    color: 'emerald',
    icon: 'emoji_events',
    priority: 1,
    suggestedActions: [
      'VIP erken erişim',
      'Özel ürün lansmanı daveti',
      'Kişisel teşekkür mesajı'
    ]
  },
  {
    id: 'loyal',
    name: { tr: 'Sadık Müşteriler', en: 'Loyal Customers' },
    description: {
      tr: 'Düzenli alışveriş yapan, güvenilir müşteriler.',
      en: 'Regular shoppers with consistent purchasing behavior.'
    },
    rfmRanges: {
      recency: { min: 3, max: 5 },
      frequency: { min: 3, max: 5 },
      monetary: { min: 3, max: 5 }
    },
    color: 'blue',
    icon: 'favorite',
    priority: 2,
    suggestedActions: [
      'Sadakat programı tanıtımı',
      'Çapraz satış önerileri',
      'Özel indirim kodları'
    ]
  },
  {
    id: 'potential',
    name: { tr: 'Potansiyel Sadıklar', en: 'Potential Loyalists' },
    description: {
      tr: 'Yeni ama aktif. Doğru stratejilerle sadık müşteri olabilirler.',
      en: 'Recent customers with potential to become loyal.'
    },
    rfmRanges: {
      recency: { min: 4, max: 5 },
      frequency: { min: 1, max: 3 },
      monetary: { min: 2, max: 4 }
    },
    color: 'violet',
    icon: 'trending_up',
    priority: 3,
    suggestedActions: [
      'İkinci alışveriş indirimi',
      'Ürün önerileri',
      'Marka hikayesi paylaşımı'
    ]
  },
  {
    id: 'new',
    name: { tr: 'Yeni Müşteriler', en: 'New Customers' },
    description: {
      tr: 'Henüz ilk alışverişini yapmış. İlk izlenim kritik.',
      en: 'Just made their first purchase. First impression matters.'
    },
    rfmRanges: {
      recency: { min: 4, max: 5 },
      frequency: { min: 1, max: 1 },
      monetary: { min: 1, max: 3 }
    },
    color: 'cyan',
    icon: 'person_add',
    priority: 4,
    suggestedActions: [
      'Hoşgeldin email serisi',
      'Ürün kullanım rehberi',
      'Sosyal medya takip daveti'
    ]
  },
  {
    id: 'at_risk',
    name: { tr: 'Risk Altında', en: 'At Risk' },
    description: {
      tr: 'Eskiden aktifti ama uzun süredir alışveriş yapmıyor.',
      en: 'Previously active but haven\'t purchased recently.'
    },
    rfmRanges: {
      recency: { min: 2, max: 3 },
      frequency: { min: 2, max: 5 },
      monetary: { min: 2, max: 5 }
    },
    color: 'amber',
    icon: 'warning',
    priority: 5,
    suggestedActions: [
      'Win-back kampanyası',
      'Özel indirim teklifi',
      'Yeni ürün duyurusu'
    ]
  },
  {
    id: 'hibernating',
    name: { tr: 'Uykuda', en: 'Hibernating' },
    description: {
      tr: 'Çok uzun süredir alışveriş yapmamış düşük aktiviteli müşteriler.',
      en: 'Low activity customers who haven\'t purchased in a long time.'
    },
    rfmRanges: {
      recency: { min: 1, max: 2 },
      frequency: { min: 1, max: 2 },
      monetary: { min: 1, max: 2 }
    },
    color: 'slate',
    icon: 'bedtime',
    priority: 6,
    suggestedActions: [
      'Reaktivasyon kampanyası',
      'Anket ile geri bildirim',
      'Son şans indirimi'
    ]
  },
  {
    id: 'lost',
    name: { tr: 'Kaybedilmiş', en: 'Lost' },
    description: {
      tr: 'Çok uzun süredir etkileşim yok. Geri kazanmak zor.',
      en: 'No interaction for a very long time. Hard to win back.'
    },
    rfmRanges: {
      recency: { min: 1, max: 1 },
      frequency: { min: 1, max: 3 },
      monetary: { min: 1, max: 3 }
    },
    color: 'red',
    icon: 'person_off',
    priority: 7,
    suggestedActions: [
      'Son şans emaili',
      'Agresif indirim',
      'Neden ayrıldınız anketi'
    ]
  }
]

export const DEFAULT_RFM_CONFIG: RFMConfig = {
  enabled: true,
  calculationSchedule: 'daily',
  lastCalculatedAt: null,
  thresholds: DEFAULT_RFM_THRESHOLDS,
  segments: DEFAULT_SEGMENT_DEFINITIONS,
  notifyOnSegmentChange: true,
  notifyChannels: ['telegram'],
  minOrdersForRFM: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: null
}

// =====================================================
// AGGREGATED STATS (Dashboard için)
// =====================================================

export type RFMSegmentStats = {
  segmentId: CustomerSegmentId
  customerCount: number
  totalRevenue: number
  avgOrderValue: number
  avgFrequency: number
  percentageOfTotal: number
}

export type RFMDashboardData = {
  totalCustomers: number
  customersWithRFM: number
  segmentStats: RFMSegmentStats[]
  calculatedAt: string
  // Segment geçişleri (son 30 gün)
  recentTransitions: {
    customerId: string
    customerEmail: string
    fromSegment: CustomerSegmentId
    toSegment: CustomerSegmentId
    changedAt: string
  }[]
}

// =====================================================
// CLV (Customer Lifetime Value) TYPES
// SaaS-Dostu: Formül parametreleri config'den
// =====================================================

// CLV hesaplama yöntemi
export type CLVCalculationMethod = 'simple' | 'historical' | 'predictive'

// CLV Config - Admin panelden düzenlenebilir
export type CLVConfig = {
  // Feature flag
  enabled: boolean

  // Hesaplama yöntemi
  calculationMethod: CLVCalculationMethod

  // Basit CLV formülü parametreleri
  // CLV = AOV × PurchaseFrequency × CustomerLifespan
  simpleFormula: {
    // Müşteri ömrü (yıl cinsinden) - varsayılan tahmini değer
    defaultCustomerLifespanYears: number
    // Kar marjı oranı (0-1 arası) - net CLV için
    profitMarginRate: number
  }

  // Historik CLV - Geçmiş verilere dayalı
  historicalFormula: {
    // Minimum sipariş sayısı (güvenilir hesaplama için)
    minOrdersRequired: number
    // Analiz dönemi (ay)
    analysisPeriodMonths: number
  }

  // CLV segmentleri (tier'lar)
  tiers: CLVTier[]

  // Meta
  lastCalculatedAt: string | null
  updatedAt: string
  updatedBy: string | null
}

// CLV Tier tanımı
export type CLVTier = {
  id: string
  name: { tr: string; en: string }
  minCLV: number
  maxCLV: number | null  // null = sınırsız (en yüksek tier)
  color: string
  icon: string
  benefits: string[]
}

// Müşteri CLV verisi
export type CustomerCLV = {
  customerId: string
  customerEmail: string
  customerName: string | null

  // Temel metrikler
  totalRevenue: number           // Toplam harcama
  totalOrders: number            // Toplam sipariş
  avgOrderValue: number          // Ortalama sipariş değeri (AOV)
  purchaseFrequency: number      // Yıllık satın alma sıklığı
  customerAgeDays: number        // Müşteri olarak geçen gün
  daysSinceFirstOrder: number    // İlk siparişten bu yana gün
  daysSinceLastOrder: number     // Son siparişten bu yana gün

  // CLV değerleri
  historicalCLV: number          // Şimdiye kadar kazandırdığı değer
  predictedCLV: number           // Tahmini gelecek değer
  totalCLV: number               // Toplam CLV (historical + predicted)

  // Tier
  tierId: string
  tierName: string

  // Trend
  clvTrend: 'increasing' | 'stable' | 'decreasing'
  lastMonthRevenue: number
  last3MonthsRevenue: number

  // Meta
  calculatedAt: string
  calculationMethod: CLVCalculationMethod
}

// CLV Dashboard verileri
export type CLVDashboardData = {
  // Özet metrikler
  totalCLV: number
  avgCLV: number
  medianCLV: number
  maxCLV: number

  // Tier dağılımı
  tierDistribution: {
    tierId: string
    tierName: string
    customerCount: number
    totalCLV: number
    avgCLV: number
    percentageOfCustomers: number
    percentageOfCLV: number
  }[]

  // Segment bazlı CLV
  segmentCLV: {
    segmentId: CustomerSegmentId
    avgCLV: number
    totalCLV: number
    customerCount: number
  }[]

  // Aylık CLV trendi (son 12 ay)
  monthlyTrend: {
    month: string  // YYYY-MM format
    avgCLV: number
    newCustomerCLV: number
    totalRevenue: number
  }[]

  // Top müşteriler
  topCustomers: {
    customerId: string
    customerEmail: string
    customerName: string | null
    totalCLV: number
    tierId: string
  }[]

  calculatedAt: string
}

// Default CLV Config
export const DEFAULT_CLV_CONFIG: CLVConfig = {
  enabled: true,
  calculationMethod: 'historical',
  simpleFormula: {
    defaultCustomerLifespanYears: 3,
    profitMarginRate: 0.4  // %40 kar marjı
  },
  historicalFormula: {
    minOrdersRequired: 1,
    analysisPeriodMonths: 24
  },
  tiers: [
    {
      id: 'bronze',
      name: { tr: 'Bronz', en: 'Bronze' },
      minCLV: 0,
      maxCLV: 500,
      color: 'amber',
      icon: 'military_tech',
      benefits: ['Standart hizmet']
    },
    {
      id: 'silver',
      name: { tr: 'Gümüş', en: 'Silver' },
      minCLV: 500,
      maxCLV: 1500,
      color: 'slate',
      icon: 'workspace_premium',
      benefits: ['Öncelikli destek', '%5 indirim']
    },
    {
      id: 'gold',
      name: { tr: 'Altın', en: 'Gold' },
      minCLV: 1500,
      maxCLV: 5000,
      color: 'yellow',
      icon: 'emoji_events',
      benefits: ['VIP destek', '%10 indirim', 'Erken erişim']
    },
    {
      id: 'platinum',
      name: { tr: 'Platin', en: 'Platinum' },
      minCLV: 5000,
      maxCLV: null,
      color: 'violet',
      icon: 'diamond',
      benefits: ['Özel müşteri temsilcisi', '%15 indirim', 'Ücretsiz kargo', 'Özel ürün lansmanları']
    }
  ],
  lastCalculatedAt: null,
  updatedAt: new Date().toISOString(),
  updatedBy: null
}

// =====================================================
// COHORT ANALYSIS TYPES
// SaaS-Dostu: Config-driven cohort analizi
// =====================================================

// Cohort periyodu tipi
export type CohortPeriod = 'weekly' | 'monthly' | 'quarterly'

// Cohort metrikleri
export type CohortMetric = 'retention' | 'revenue' | 'orders' | 'aov'

// Cohort Config - Admin panelden düzenlenebilir
export type CohortConfig = {
  // Feature flag
  enabled: boolean

  // Cohort periyodu
  defaultPeriod: CohortPeriod

  // Analiz penceresi
  analysisWindowMonths: number  // Kaç aylık cohort gösterilsin

  // Retention periyotları (ay cinsinden)
  // Örnek: [1, 2, 3, 6, 12] → Ay 1, Ay 2, Ay 3, Ay 6, Ay 12 retention
  retentionPeriods: number[]

  // Minimum müşteri sayısı (güvenilir cohort için)
  minCustomersPerCohort: number

  // Heatmap renk skalası eşikleri (% cinsinden)
  heatmapThresholds: {
    low: number      // Bu altı kırmızı (örn: 10)
    medium: number   // Bu arası sarı (örn: 30)
    high: number     // Bu üstü yeşil (örn: 50)
  }

  // Meta
  lastCalculatedAt: string | null
  updatedAt: string
  updatedBy: string | null
}

// Tek bir cohort grubu
export type CohortGroup = {
  // Cohort tanımlayıcı
  cohortId: string           // "2024-01" formatında
  cohortLabel: string        // "Ocak 2024" gibi
  cohortStartDate: string    // ISO date
  cohortEndDate: string      // ISO date

  // Cohort büyüklüğü
  initialCustomers: number   // Bu dönemde ilk alışverişini yapan müşteri sayısı
  initialRevenue: number     // İlk dönem geliri

  // Retention verileri (periyot bazlı)
  retention: CohortRetentionData[]

  // Gelir verileri (periyot bazlı)
  revenue: CohortRevenueData[]

  // Özet metrikler
  avgRetention: number       // Ortalama retention (%)
  totalCohortRevenue: number // Cohort'un toplam geliri
  avgRevenuePerCustomer: number
  lifetimeValue: number      // Cohort LTV
}

// Cohort retention verisi (her periyot için)
export type CohortRetentionData = {
  periodIndex: number        // 0 = ilk ay, 1 = ikinci ay, vs.
  periodLabel: string        // "Ay 1", "Ay 2", vs.
  customersActive: number    // Bu periyotta aktif müşteri sayısı
  retentionRate: number      // Retention oranı (% - 0-100)
  churnedCustomers: number   // Kaybedilen müşteri
}

// Cohort gelir verisi (her periyot için)
export type CohortRevenueData = {
  periodIndex: number
  periodLabel: string
  revenue: number            // Bu periyottaki gelir
  orders: number             // Sipariş sayısı
  avgOrderValue: number      // Ortalama sipariş değeri
  revenuePerCustomer: number // Müşteri başına gelir
  cumulativeRevenue: number  // Kümülatif gelir
}

// Cohort Dashboard verileri
export type CohortDashboardData = {
  // Cohort listesi (en yeniden en eskiye)
  cohorts: CohortGroup[]

  // Retention matrisi (heatmap için)
  retentionMatrix: {
    cohortId: string
    cohortLabel: string
    values: (number | null)[]  // Her periyot için retention % (null = henüz o periyoda ulaşılmadı)
  }[]

  // Gelir matrisi
  revenueMatrix: {
    cohortId: string
    cohortLabel: string
    values: (number | null)[]
  }[]

  // Özet metrikler
  summary: {
    avgFirstMonthRetention: number
    avgThirdMonthRetention: number
    avgSixthMonthRetention: number
    bestPerformingCohort: string
    worstPerformingCohort: string
    overallTrend: 'improving' | 'stable' | 'declining'
  }

  // Karşılaştırma (önceki dönemle)
  comparison: {
    retentionChange: number    // % değişim
    revenueChange: number
    ltpChange: number          // LTV değişimi
  }

  calculatedAt: string
  period: CohortPeriod
}

// Cohort karşılaştırma
export type CohortComparison = {
  cohort1Id: string
  cohort2Id: string
  retentionDiff: number[]     // Her periyot için fark
  revenueDiff: number[]
  insights: string[]          // Otomatik içgörüler
}

// Default Cohort Config
export const DEFAULT_COHORT_CONFIG: CohortConfig = {
  enabled: true,
  defaultPeriod: 'monthly',
  analysisWindowMonths: 12,
  retentionPeriods: [1, 2, 3, 4, 5, 6],  // 6 aylık retention takibi
  minCustomersPerCohort: 5,
  heatmapThresholds: {
    low: 15,      // %15 altı kırmızı
    medium: 35,   // %15-35 sarı
    high: 50      // %50 üstü yeşil
  },
  lastCalculatedAt: null,
  updatedAt: new Date().toISOString(),
  updatedBy: null
}
