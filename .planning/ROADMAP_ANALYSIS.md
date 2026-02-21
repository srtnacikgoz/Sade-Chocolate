# Admin Panel Roadmap - SaaS-Dostu Analiz Raporu

> Oluşturulma: 2026-01-30
> Yaklaşım: SaaS-Dostu Kod Yazım Standartları

---

## 📊 Genel Durum Özeti

### Mevcut Altyapı Durumu

| Bileşen | Durum | Notlar |
|---------|-------|--------|
| **Firestore** | ✅ Hazır | 16+ koleksiyon, iyi yapılandırılmış |
| **Cloud Functions** | ✅ Hazır | 31 function, europe-west3 region |
| **SendGrid** | ✅ Hazır | Firebase Extension ile entegre |
| **Visitor Tracking** | ✅ Hazır | Session, abandoned cart, daily stats |
| **Telegram Bot** | ✅ Hazır | Bildirimler için kullanılıyor |
| **Admin Panel** | ✅ Hazır | 18 tab, Tab-based architecture |

### SaaS-Dostu Uyumluluk Skoru

| Kriter | Skor | Açıklama |
|--------|------|----------|
| Config-Driven | 🟡 60% | TrackingConfig iyi, ama email/stok config yok |
| Multi-Tenant Ready | 🔴 20% | Tenant ID yok, global yapı |
| Feature Flags | 🔴 10% | Sadece maintenance mode var |
| Soft Delete | 🟡 50% | Bazı yerlerde var, tutarsız |
| Zincir Tamamlığı | 🟢 80% | Çoğu feature tam çalışıyor |

---

## 🔴 Milestone 1: Gelir Kurtarma

### Faz 1.1: Otomatik Sepet Kurtarma Email Sistemi

#### Mevcut Durum
```
abandoned_carts koleksiyonu: ✅ VAR
detectAbandonedCarts Cloud Function: ✅ VAR
recoveryEmailSent alanı: ✅ VAR
Sepet kurtarma emaili: ❌ YOK (sadece flag güncelleniyor)
Email gönderim zamanlaması: ❌ YOK
Admin panelde tracking: ❌ YOK
```

#### Eksik Zincir Analizi
```
UI'da buton var → Firestore flag güncelleniyor → EMAIL GÖNDERİLMİYOR!
                                                 ↑ ZİNCİR KIRILIYOR

BehaviorTrackingTab.tsx:247:
  await updateDoc(cartRef, { recoveryEmailSent: true })
  alert('Email gonderildi: ' + cart.customerEmail)
  // ⚠️ YANLIŞ: Flag güncelleniyor ama email gönderilmiyor!
```

#### SaaS-Dostu Çözüm Planı

**1. Config Yapısı (Firestore: `settings/recovery_email`):**
```typescript
type RecoveryEmailConfig = {
  enabled: boolean                    // Feature flag
  emailSchedule: number[]             // [60, 1440, 4320] = 1 saat, 24 saat, 72 saat (dakika)
  minCartValue: number                // 100 TL üzeri için gönder
  maxEmailsPerCart: number            // 3 email max
  discountEnabled: boolean            // İlk emailde indirim var mı
  discountPercent: number             // %10
  discountValidityHours: number       // 48 saat
  emailSubjects: {
    first: string                     // "Sepetinizi unutmadık 🛒"
    second: string                    // "Son fırsat: %10 indirim!"
    third: string                     // "Çikolatalarınız sizi bekliyor"
  }
}
```

**2. Yeni Cloud Function: `sendRecoveryEmails`**
- Scheduled: Her 15 dakikada bir
- `abandoned_carts` where `recoveryEmailSent != true` AND `customerEmail != null`
- Email timing kontrolü (1h, 24h, 72h)
- SendGrid üzerinden email gönderimi
- `recovery_email_logs` koleksiyonuna kayıt

**3. Email Template: `recoveryEmailTemplate.ts`**
- Sepetteki ürünler (görsel + fiyat)
- CTA butonu: "Alışverişe Devam Et"
- İndirim kodu (opsiyonel)
- Marka tarzına uygun premium design

**4. Admin Panel Tracking:**
- Recovery Email Gönderildi sayısı
- Açılma oranı (SendGrid webhook)
- Kurtarılan sepet sayısı ve değeri

#### Uygulama Sırası
1. [ ] `settings/recovery_email` config yapısı oluştur
2. [ ] `sendRecoveryCartEmail` fonksiyonu (emailService.ts)
3. [ ] `sendRecoveryEmails` Cloud Function
4. [ ] `recovery_email_logs` koleksiyonu
5. [ ] Admin panel config UI
6. [ ] Recovery tracking dashboard

---

### Faz 1.2: Stok Uyarı Sistemi

#### Mevcut Durum
```
products.stock alanı: ❌ YOK (sadece isOutOfStock boolean)
products.minStock alanı: ❌ YOK
Stok uyarı Cloud Function: ❌ YOK
Admin panelde stok uyarı: ❌ YOK
```

#### Eksik Zincir Analizi
```
Ürün stok takibi YOK!
Sadece "isOutOfStock" boolean var
Manuel kontrol gerekiyor
Satış kaybı riski YÜKSEK
```

#### SaaS-Dostu Çözüm Planı

**1. Product Schema Genişletme:**
```typescript
// Mevcut
type Product = {
  isOutOfStock: boolean
  // ...
}

// YENİ
type Product = {
  isOutOfStock: boolean
  stock: number                       // Mevcut stok
  minStock: number                    // Minimum stok eşiği (default: 5)
  stockAlertEnabled: boolean          // Ürün bazlı alert açık/kapalı
  lastStockAlert: Timestamp | null    // Son uyarı zamanı
  stockHistory: StockChange[]         // Stok geçmişi (opsiyonel)
}

type StockChange = {
  date: Timestamp
  change: number                      // +10 veya -2
  reason: 'sale' | 'restock' | 'adjustment'
  orderId?: string
}
```

**2. Config Yapısı (Firestore: `settings/stock_alert`):**
```typescript
type StockAlertConfig = {
  enabled: boolean
  defaultMinStock: number             // 5
  alertChannels: ('telegram' | 'email')[]
  alertFrequency: 'immediate' | 'daily_digest'
  criticalThreshold: number           // 0 = kritik (tükenme)
  lowThreshold: number                // minStock = düşük
  telegramChatId: string
  emailRecipients: string[]
}
```

**3. Yeni Cloud Function: `checkLowStock`**
- Scheduled: Her saat
- `products` where `stock <= minStock AND stockAlertEnabled == true`
- Telegram + Email bildirimi
- `stock_alerts` koleksiyonuna kayıt

**4. Order Trigger Güncellemesi:**
- Sipariş onaylandığında stok azalt
- İptal/iade durumunda stok artır
- Her değişiklikte minStock kontrolü

**5. Admin Panel:**
- Ürün formuna stock alanları ekle
- "Düşük Stok" badge/filter
- Stok raporu sayfası

---

## 🟡 Milestone 2: Müşteri Zekası

### Faz 2.1: RFM Müşteri Segmentasyonu

#### Mevcut Durum
```
orders koleksiyonu: ✅ VAR
customers koleksiyonu: ✅ VAR
RFM skorları: ❌ YOK
Müşteri segmentleri: ❌ YOK
```

#### SaaS-Dostu Çözüm Planı

**1. RFM Score Collection (Firestore: `rfm_scores`):**
```typescript
type RFMScore = {
  customerId: string
  customerEmail: string
  customerName: string

  // Ham değerler
  recencyDays: number                 // Son siparişten bu yana gün
  frequency: number                   // Toplam sipariş sayısı
  monetary: number                    // Toplam harcama (TL)

  // Skorlar (1-5)
  recencyScore: 1 | 2 | 3 | 4 | 5
  frequencyScore: 1 | 2 | 3 | 4 | 5
  monetaryScore: 1 | 2 | 3 | 4 | 5

  // Hesaplanan
  totalScore: number                  // 3-15
  segment: CustomerSegment

  // Meta
  calculatedAt: Timestamp
  orderCount: number
  lastOrderDate: Timestamp
  avgOrderValue: number
}

type CustomerSegment =
  | 'champions'           // R=5, F=5, M=5
  | 'loyal_customers'     // R>=3, F>=4, M>=4
  | 'potential_loyalists' // R>=4, F>=2, M>=2
  | 'new_customers'       // R=5, F=1
  | 'at_risk'             // R<=2, F>=3
  | 'lost'                // R=1, F>=1
```

**2. Config Yapısı (Firestore: `settings/rfm`):**
```typescript
type RFMConfig = {
  enabled: boolean
  recencyBuckets: number[]           // [30, 60, 90, 180, 365] gün
  frequencyBuckets: number[]         // [1, 2, 4, 8, 15] sipariş
  monetaryBuckets: number[]          // [500, 1500, 3000, 6000, 12000] TL
  segmentDefinitions: SegmentRule[]
}

type SegmentRule = {
  segment: CustomerSegment
  label: string                       // "Şampiyonlar"
  description: string                 // "En değerli müşteriler"
  recencyMin: number
  frequencyMin: number
  monetaryMin: number
  suggestedAction: string             // "VIP muamele, erken erişim"
}
```

**3. Cloud Function: `calculateRFMScores`**
- Scheduled: Günlük (gece 03:00)
- Tüm müşteriler için RFM hesaplama
- Segment ataması
- `rfm_scores` koleksiyonuna yazma
- Segment değişim logları

**4. Admin Panel:**
- "Müşteri Segmentleri" tab'ı
- Segment bazlı müşteri listesi
- Segment geçiş grafiği
- Segment aksiyonları (email gönder, kupon ver)

---

### Faz 2.2: Customer Lifetime Value (CLV)

#### SaaS-Dostu Çözüm

**1. CLV Hesaplama:**
```typescript
// Basit CLV formülü
CLV = (Ortalama Sipariş Değeri) × (Yıllık Sipariş Sayısı) × (Müşteri Ömrü Yıl)

// Gelişmiş CLV (cohort-based)
CLV = Σ(Gelecek Gelir × İndirim Faktörü)
```

**2. RFM Score'a CLV Ekleme:**
```typescript
type RFMScore = {
  // ... mevcut alanlar
  clv: number                         // Lifetime value (TL)
  clvTier: 'low' | 'medium' | 'high' | 'premium'
  predictedNextOrder: Timestamp | null
}
```

---

### Faz 2.3: Cohort Analizi

#### SaaS-Dostu Çözüm

**1. Cohort Collection (Firestore: `cohort_stats`):**
```typescript
type CohortStats = {
  cohortMonth: string                 // "2026-01"
  customerCount: number               // Bu ayda ilk sipariş veren
  retentionByMonth: {
    [monthOffset: string]: {
      activeCustomers: number
      revenue: number
      orderCount: number
    }
  }
}
```

**2. Cloud Function: `calculateCohortStats`**
- Scheduled: Günlük
- Aylık cohort grupları oluştur
- Retention matrix hesapla

---

## 🟢 Milestone 3: Dashboard & Raporlama

### Faz 3.1: Ana Dashboard Yenileme

#### Mevcut Durum
```
KPI kartları: ⚠️ TEMEL (sadece sipariş sayısı)
Grafikler: ❌ YOK
Tarih seçimi: ❌ YOK
Karşılaştırma: ❌ YOK
```

#### SaaS-Dostu Çözüm

**1. Dashboard Config (Firestore: `settings/dashboard`):**
```typescript
type DashboardConfig = {
  defaultDateRange: 'today' | 'week' | 'month'
  kpiCards: KPICardConfig[]
  charts: ChartConfig[]
  refreshInterval: number             // saniye
}

type KPICardConfig = {
  id: string
  label: string
  metric: 'revenue' | 'orders' | 'aov' | 'conversion' | 'visitors'
  showComparison: boolean
  comparisonPeriod: 'previous_period' | 'same_period_last_year'
}
```

**2. Dashboard Stats Collection:**
- `daily_stats` zaten var, genişletilecek
- Real-time güncelleme için Firestore listener

**3. Grafik Kütüphanesi:**
- Recharts (React uyumlu, lightweight)
- Chart tipleri: Line, Bar, Pie, Area

**4. KPI Kartları:**
- Bugünün Satışları (₺ + adet)
- Bu Hafta (geçen haftayla %)
- Bu Ay (geçen ayla %)
- AOV (Ortalama Sipariş Değeri)
- Dönüşüm Oranı
- Aktif Ziyaretçi

---

### Faz 3.2: Rapor Export Sistemi

#### SaaS-Dostu Çözüm

**1. Export Config:**
```typescript
type ExportConfig = {
  formats: ('excel' | 'csv' | 'pdf')[]
  reports: ReportDefinition[]
}

type ReportDefinition = {
  id: string
  name: string                        // "Sipariş Raporu"
  collection: string                  // "orders"
  fields: string[]                    // ["orderId", "customerName", ...]
  filters: FilterDefinition[]
  defaultDateRange: number            // 30 gün
}
```

**2. Cloud Function: `generateReport`**
- On-demand rapor oluşturma
- Excel/CSV: xlsx veya papaparse
- PDF: pdf-lib veya puppeteer
- Storage'a yükle, URL döndür

---

## 🟠 Milestone 4: Pazarlama Otomasyonu

### Faz 4.1: Email Pazarlama Otomasyonu

#### SaaS-Dostu Çözüm

**1. Email Automation Collection:**
```typescript
type EmailAutomation = {
  id: string
  name: string                        // "Hoşgeldin Serisi"
  trigger: AutomationTrigger
  isActive: boolean
  emails: EmailStep[]
  stats: {
    totalSent: number
    totalOpened: number
    totalClicked: number
  }
}

type AutomationTrigger =
  | { type: 'signup' }
  | { type: 'first_order' }
  | { type: 'abandoned_cart'; minValue: number }
  | { type: 'inactivity'; days: number }
  | { type: 'birthday' }

type EmailStep = {
  order: number
  delayMinutes: number                // Önceki adımdan sonra
  templateId: string
  subject: string
  couponCode?: string
}
```

**2. Email Logs Collection:**
```typescript
type EmailLog = {
  automationId: string
  customerId: string
  customerEmail: string
  emailStepOrder: number
  sentAt: Timestamp
  openedAt: Timestamp | null
  clickedAt: Timestamp | null
  unsubscribedAt: Timestamp | null
}
```

---

### Faz 4.2: Kupon & İndirim Yönetimi

#### Mevcut Durum
```
Kupon sistemi: ❌ YOK (sadece manuel)
```

#### SaaS-Dostu Çözüm

**1. Coupons Collection:**
```typescript
type Coupon = {
  id: string
  code: string                        // "HOSGELDIN10"
  type: 'percent' | 'fixed' | 'free_shipping'
  value: number                       // 10 (% veya TL)

  // Limitler
  minCartValue: number                // Minimum sepet tutarı
  maxDiscount: number                 // Maximum indirim (% için)
  usageLimit: number                  // Toplam kullanım limiti
  perCustomerLimit: number            // Kişi başı limit

  // Geçerlilik
  validFrom: Timestamp
  validUntil: Timestamp

  // Kısıtlamalar
  applicableProducts: string[]        // Boş = tümü
  applicableCategories: string[]      // Boş = tümü
  excludedProducts: string[]
  firstOrderOnly: boolean

  // İstatistikler
  usedCount: number
  totalDiscount: number               // Toplam indirim tutarı

  // Meta
  createdAt: Timestamp
  createdBy: string
  isActive: boolean
}
```

---

## 📋 Uygulama Öncelik Sırası

### Hafta 1-2: Temel Altyapı
1. [ ] Config collection yapısı (`settings/*`)
2. [ ] Feature flags sistemi
3. [ ] Admin panel config UI pattern'i

### Hafta 3-4: Gelir Kurtarma (M1)
4. [ ] Faz 1.1: Sepet kurtarma email (TAM ZİNCİR)
5. [ ] Faz 1.2: Stok uyarı sistemi (TAM ZİNCİR)

### Hafta 5-6: Dashboard (M3.1)
6. [ ] KPI kartları
7. [ ] Grafikler (Recharts)
8. [ ] Tarih seçimi ve karşılaştırma

### Hafta 7-8: Müşteri Zekası (M2.1)
9. [ ] RFM hesaplama Cloud Function
10. [ ] Müşteri segmentleri UI

### Hafta 9+: Pazarlama (M4)
11. [ ] Kupon sistemi
12. [ ] Email otomasyon builder
13. [ ] Referral sistemi genişletme

---

## ⚠️ SaaS-Dostu Kontrol Noktaları

Her feature için kontrol et:

### Tam Zincir Kontrolü
- [ ] UI'da görünüyor mu?
- [ ] State'e bağlı mı?
- [ ] API'ye gönderiliyor mu?
- [ ] Backend'de işleniyor mu?
- [ ] Firestore'a kaydediliyor mu?
- [ ] Bir yerde okunuyor mu?
- [ ] Sonuç üretiyor mu?

### Config-Driven Kontrolü
- [ ] Hardcoded değer var mı?
- [ ] Admin panelden yönetilebilir mi?
- [ ] Deploy olmadan değiştirilebilir mi?

### Multi-Tenant Hazırlık
- [ ] Tenant ID eklenebilir mi?
- [ ] Veri izolasyonu sağlanıyor mu?

### Feature Flag Kontrolü
- [ ] Özellik açılıp kapatılabilir mi?
- [ ] A/B test yapılabilir mi?

---

## 📌 Sonuç

Bu roadmap, Sade Chocolate admin panelini dünya standartlarında bir platforma dönüştürecek. SaaS-dostu yaklaşımla:

1. **Her özellik tam çalışacak** - İşlevsiz kod yok
2. **Config-driven olacak** - Deploy gerektirmeden değişiklik
3. **Multi-tenant ready** - Gelecekte ölçeklenebilir
4. **Ölçülebilir olacak** - Her metrik takip edilebilir

Başlamak için onay bekliyorum.
