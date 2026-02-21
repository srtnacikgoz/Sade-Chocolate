# Sade Chocolate Admin Panel Geliştirme Roadmap

## Vizyon
Sade Chocolate admin panelini dünya standartlarında bir e-ticaret yönetim platformuna dönüştürmek.

---

## Milestone 1: Gelir Kurtarma (Revenue Recovery)
> Öncelik: **KRİTİK** - Direkt gelir etkisi

### Faz 1.1: Otomatik Sepet Kurtarma Email Sistemi
**Amaç:** Terk edilen sepetlerin %3-5'ini geri kazanmak

**Yapılacaklar:**
- [ ] Email şablonu tasarımı (sepetteki ürünler, fiyat, CTA butonu)
- [ ] Firebase Cloud Function: Terk edilen sepet tespiti (30dk inaktivite)
- [ ] Otomatik email gönderimi (SendGrid entegrasyonu mevcut)
- [ ] Email gönderim zamanlaması: 1 saat, 24 saat, 72 saat
- [ ] Admin panelde "Recovery Email Gönderildi" durumu
- [ ] Kurtarılan sepet tracking ve raporlama

**Teknik:**
```
sessions (Firestore) → Cloud Function (scheduled) → SendGrid → Müşteri
```

**Başarı Kriteri:** İlk ayda en az 5 sepet kurtarılması

---

### Faz 1.2: Stok Uyarı Sistemi
**Amaç:** Stok tükenmesinden kaynaklanan satış kaybını önlemek

**Yapılacaklar:**
- [ ] Ürün bazında minimum stok eşiği ayarı
- [ ] Düşük stok algılama (Cloud Function)
- [ ] Telegram bildirimi (mevcut bot üzerinden)
- [ ] Admin panelde "Düşük Stok" badge/filter
- [ ] Kritik stok raporu

**Başarı Kriteri:** Hiçbir ürün fark edilmeden tükenmemeli

---

## Milestone 2: Müşteri Zekası (Customer Intelligence)
> Öncelik: **YÜKSEK** - Stratejik kararlar için

### Faz 2.1: RFM Müşteri Segmentasyonu
**Amaç:** Müşterileri değerlerine göre segmentlere ayırmak

**Segmentler:**
| Segment | Tanım | Aksiyon |
|---------|-------|---------|
| Şampiyonlar | Yüksek R, F, M | VIP muamele, erken erişim |
| Sadık Müşteriler | Yüksek F, M | Sadakat programı |
| Potansiyel Sadıklar | Yüksek R, orta F | Upsell kampanyaları |
| Yeni Müşteriler | Çok yüksek R, düşük F | Hoşgeldin serisi |
| Risk Altında | Düşen R | Win-back kampanyası |
| Kaybedilmiş | Çok düşük R | Son şans teklifi |

**Yapılacaklar:**
- [ ] RFM skorlama algoritması (orders collection'dan)
- [ ] Müşteri segmenti hesaplama (Cloud Function - günlük)
- [ ] Admin panelde "Müşteri Segmentleri" tab'ı
- [ ] Segment bazlı müşteri listesi
- [ ] Segment geçiş grafiği (aydan aya)

**Teknik:**
```typescript
type RFMScore = {
  recency: 1 | 2 | 3 | 4 | 5      // Son alışverişten bu yana gün
  frequency: 1 | 2 | 3 | 4 | 5    // Toplam sipariş sayısı
  monetary: 1 | 2 | 3 | 4 | 5     // Toplam harcama
  segment: CustomerSegment
  score: number                    // Toplam skor (3-15)
}
```

---

### Faz 2.2: Customer Lifetime Value (CLV)
**Amaç:** Her müşterinin toplam değerini hesaplamak

**Yapılacaklar:**
- [ ] CLV hesaplama formülü implementasyonu
- [ ] Müşteri kartında CLV gösterimi
- [ ] Ortalama CLV trendi (aylık)
- [ ] Segment bazlı CLV karşılaştırması
- [ ] Acquisition channel bazlı CLV

**Formül:**
```
CLV = (Ortalama Sipariş Değeri) × (Satın Alma Sıklığı) × (Müşteri Ömrü)
```

---

### Faz 2.3: Cohort Analizi
**Amaç:** Müşteri gruplarının zaman içindeki davranışını anlamak

**Yapılacaklar:**
- [ ] Aylık cohort grupları (ilk alışveriş ayına göre)
- [ ] Retention oranı matrisi
- [ ] Cohort bazlı gelir analizi
- [ ] Görsel cohort tablosu (heatmap)

---

## Milestone 3: Dashboard & Raporlama
> Öncelik: **YÜKSEK** - Hızlı karar alma

### Faz 3.1: Ana Dashboard Yenileme
**Amaç:** Tek bakışta tüm kritik metrikleri görmek

**KPI Kartları:**
- [ ] Bugünün Satışları (₺ ve adet)
- [ ] Bu Haftanın Satışları (geçen haftayla karşılaştırma)
- [ ] Bu Ayın Satışları (geçen ayla karşılaştırma)
- [ ] Ortalama Sipariş Değeri (AOV)
- [ ] Dönüşüm Oranı
- [ ] Aktif Ziyaretçi Sayısı

**Grafikler:**
- [ ] Satış trendi (son 30 gün - çizgi grafik)
- [ ] Sipariş dağılımı (saatlik - bar chart)
- [ ] Trafik kaynakları (pie chart)
- [ ] En çok satan ürünler (horizontal bar)

**Yapılacaklar:**
- [ ] Recharts/Chart.js entegrasyonu
- [ ] Real-time veri güncelleme
- [ ] Tarih aralığı seçimi (bugün, bu hafta, bu ay, özel)
- [ ] Karşılaştırma modu (önceki dönemle)

---

### Faz 3.2: Rapor Export Sistemi
**Amaç:** Detaylı raporları dışa aktarmak

**Yapılacaklar:**
- [ ] Sipariş raporu (Excel/CSV)
- [ ] Müşteri raporu (Excel/CSV)
- [ ] Satış raporu (PDF)
- [ ] Stok raporu (Excel)
- [ ] Tarih aralığı filtreleme
- [ ] Email ile rapor gönderimi (opsiyonel)

---

## Milestone 4: Pazarlama Otomasyonu
> Öncelik: **ORTA** - Büyüme için

### Faz 4.1: Email Pazarlama Otomasyonu
**Amaç:** Müşteri yaşam döngüsü boyunca otomatik iletişim

**Email Flowları:**
1. **Hoşgeldin Serisi** (3 email)
   - Hemen: Hoşgeldin + %10 kupon
   - 3 gün: Marka hikayesi
   - 7 gün: En çok satanlar

2. **Satın Alma Sonrası** (2 email)
   - 3 gün: Sipariş memnuniyeti
   - 14 gün: Yorum iste + öneri

3. **Win-back** (2 email)
   - 30 gün inaktif: "Seni özledik" + %15
   - 60 gün inaktif: Son şans + %20

**Yapılacaklar:**
- [ ] Email flow builder (admin panelde)
- [ ] Trigger tanımlama (event-based)
- [ ] A/B test desteği
- [ ] Email performans metrikleri

---

### Faz 4.2: Kupon & İndirim Yönetimi (Gelişmiş)
**Amaç:** Esnek promosyon sistemi

**Yapılacaklar:**
- [ ] Kupon oluşturma wizard'ı
- [ ] Kupon tipleri: Yüzde, Sabit, Ücretsiz Kargo
- [ ] Kullanım limiti (toplam, kişi başı)
- [ ] Minimum sepet tutarı
- [ ] Geçerlilik tarihi
- [ ] Belirli ürün/kategori kısıtlaması
- [ ] İlk alışveriş kuponları
- [ ] Otomatik kupon dağıtımı (email ile)
- [ ] Kupon performans raporu

---

### Faz 4.3: Referral (Tavsiye) Sistemi
**Amaç:** Müşterilerin arkadaşlarını getirmesini sağlamak

**Yapılacaklar:**
- [ ] Benzersiz referral kodu üretimi
- [ ] Referral landing page
- [ ] Ödül sistemi (tavsiye eden + tavsiye edilen)
- [ ] Referral tracking
- [ ] Top referrer listesi

---

## Milestone 5: Gelişmiş Analitik
> Öncelik: **ORTA** - Optimizasyon için

### Faz 5.1: Ürün Performans Analizi
**Amaç:** Hangi ürünlerin iyi/kötü performans gösterdiğini anlamak

**Yapılacaklar:**
- [ ] Ürün bazlı satış grafiği
- [ ] Görüntülenme → Sepet → Satış dönüşümü
- [ ] Stok devir hızı
- [ ] Kar marjı analizi
- [ ] Birlikte satılan ürünler (cross-sell fırsatları)
- [ ] Düşük performanslı ürün uyarısı

---

### Faz 5.2: Trafik & Kaynak Analizi
**Amaç:** Hangi kanalların etkili olduğunu anlamak

**Yapılacaklar:**
- [ ] UTM parametreleri tracking
- [ ] Kaynak bazlı dönüşüm oranı
- [ ] Kaynak bazlı AOV
- [ ] Kampanya performans karşılaştırması
- [ ] Google Analytics 4 entegrasyonu (opsiyonel)

---

### Faz 5.3: Heatmap & Session Recording (Opsiyonel)
**Amaç:** Kullanıcı davranışını detaylı anlamak

**Seçenekler:**
- Hotjar entegrasyonu
- Microsoft Clarity (ücretsiz)
- Kendi çözümümüz (karmaşık)

**Tavsiye:** Microsoft Clarity ile başla (ücretsiz, kolay entegrasyon)

---

## Milestone 6: Operasyonel İyileştirmeler
> Öncelik: **DÜŞÜK** - Nice to have

### Faz 6.1: Çoklu Depo Yönetimi
- [ ] Depo tanımlama
- [ ] Depo bazlı stok
- [ ] Otomatik depo seçimi (lokasyona göre)

### Faz 6.2: Tedarikçi Yönetimi
- [ ] Tedarikçi kartları
- [ ] Sipariş takibi
- [ ] Maliyet analizi

### Faz 6.3: Personel Yönetimi
- [ ] Rol bazlı erişim (Admin, Operasyon, Pazarlama)
- [ ] Aktivite log'u
- [ ] Performans metrikleri

---

## Teknik Altyapı Gereksinimleri

### Yeni Firestore Collections
```
rfm_scores/
  {customerId}/
    recency: number
    frequency: number
    monetary: number
    segment: string
    lastCalculated: timestamp

email_automations/
  {automationId}/
    name: string
    trigger: 'abandoned_cart' | 'welcome' | 'winback' | ...
    emails: EmailStep[]
    active: boolean

email_logs/
  {logId}/
    customerId: string
    automationId: string
    emailType: string
    sentAt: timestamp
    opened: boolean
    clicked: boolean

coupons/
  {couponId}/
    code: string
    type: 'percent' | 'fixed' | 'free_shipping'
    value: number
    minCartValue: number
    usageLimit: number
    usedCount: number
    validFrom: timestamp
    validUntil: timestamp
    applicableProducts: string[]
    applicableCategories: string[]
```

### Yeni Cloud Functions
```
- calculateRFMScores (scheduled - daily)
- sendAbandonedCartEmail (scheduled - every 15 min)
- processEmailAutomation (triggered)
- generateDailyReport (scheduled - daily)
- checkLowStock (scheduled - hourly)
```

### Admin Panel Yeni Tab'lar
```
├── Dashboard (yenilenen)
├── Siparişler
├── Ürünler
├── Müşteriler
│   ├── Tüm Müşteriler
│   ├── Segmentler (YENİ)
│   └── CLV Analizi (YENİ)
├── Pazarlama (YENİ)
│   ├── Email Otomasyonları
│   ├── Kuponlar
│   └── Referral
├── Analitik (YENİ)
│   ├── Satış Raporları
│   ├── Ürün Performansı
│   └── Trafik Analizi
├── Davranış Takibi
└── Ayarlar
```

---

## Uygulama Stratejisi

### Yaklaşım: Incremental Delivery
Her faz bağımsız olarak tamamlanıp production'a alınabilir. Bir faz tamamlanmadan diğerine geçilmez.

### Öncelik Sırası
1. **Milestone 1** → Direkt gelir etkisi (önce para kazan)
2. **Milestone 3.1** → Dashboard (görünürlük)
3. **Milestone 2.1** → RFM (müşteriyi anla)
4. **Milestone 4.1** → Email otomasyon (büyüme)
5. Diğerleri → İhtiyaca göre

### Test Stratejisi
- Her faz için manuel test senaryoları
- Kritik flowlar için E2E testler
- A/B test ile validasyon (mümkün olduğunda)

---

## Başarı Metrikleri

| Metrik | Mevcut | Hedef |
|--------|--------|-------|
| Sepet Kurtarma Oranı | %0 | %5 |
| Email Open Rate | - | %40+ |
| Repeat Customer Rate | ? | %30+ |
| Dashboard Load Time | - | <2s |
| Raporlama Süresi | Manuel | Otomatik |

---

## Notlar

- Her faz için detaylı PLAN.md dosyası oluşturulacak
- Kullanıcı onayı alınmadan production'a alınmayacak
- Mevcut sistemle uyumluluk korunacak
- Mobile-first yaklaşım (admin panel responsive)

---

*Oluşturulma: 2026-01-30*
*Son Güncelleme: 2026-01-30*
