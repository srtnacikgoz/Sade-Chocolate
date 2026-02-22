# Meta & E-Ticaret Uygulama Planı

> **Oluşturulma:** 2026-02-09 11:57
> **Kaynak:** Meta & E-Ticaret Araştırma Raporu + Dijital Duyusal Sentez Gap Analizi
> **Proje:** sadechocolate.com

---

## ÖNCELİK SIRASI

### FAZ 1 — BUGÜN (Olmazsa Olmazlar)

| # | Görev | Nerede | Durum |
|---|-------|--------|-------|
| 1.1 | Cookie Consent Banner (KVKK uyumlu) | Site | ✅ |
| 1.2 | Cookie tercih yönetimi (Zorunlu/Analitik/Pazarlama sınıfları) | Site | ✅ |
| 1.3 | Meta Pixel entegrasyonu (cookie onayına bağlı) | Site | ✅ |
| 1.4 | Temel Pixel event'leri: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase | Site | ✅ |

> **Not:** Business Manager oluşturma, domain doğrulama ve Pixel ID alma → Meta projesinden yönetiliyor.
> Pixel ID hazır olduğunda .env'ye eklenecek.

### FAZ 2 — BU HAFTA (Kısa Vade)

| # | Görev | Nerede | Durum |
|---|-------|--------|-------|
| 2.1 | GA4 e-commerce event'lerini bileşenlere bağla (beginCheckout, search, viewItemList) | Site | ✅ |
| 2.2 | Event deduplication altyapısı (generateEventId → cookieConsent.ts) | Site | ✅ |
| 2.3 | Conversions API (CAPI) — Firebase Cloud Function (metaCapiService.ts) | Backend | ✅ |
| 2.4 | Open Graph tag'lerini dinamikleştir (SEOHead zaten dinamik, Checkout'a eklendi) | Site | ✅ |
| 2.5 | web-vitals ile Core Web Vitals → GA4 raporlama (CLS/INP/LCP) | Site | ✅ |

### FAZ 3 — 2 HAFTA (Orta Vade)

| # | Görev | Nerede | Durum |
|---|-------|--------|-------|
| 3.1 | Google Tag Manager (GTM) entegrasyonu | Site | ⬜ |
| 3.2 | Google Ads Pixel + Enhanced Conversions | Site/GTM | ⬜ |
| 3.3 | Terk edilmiş sepet kurtarma e-postası (1h sonra otomatik) | Backend | ✅ |
| 3.4 | Trust badge'ler (Troy kartı eklendi, mevcut badge'ler zaten kapsamlı) | Site | ✅ |
| 3.5 | Görsel optimizasyon (lazy loading + decoding=async tüm müşteri img'lerine) | Site | ✅ |
| 3.6 | Mobil sticky CTA (PDP'de sabit "Sepete Ekle" + fiyat) | Site | ✅ |

### FAZ 4 — 1 AY (Uzun Vade)

| # | Görev | Nerede | Durum |
|---|-------|--------|-------|
| 4.1 | Server-Side GTM | Backend | ⬜ (GTM kurulumuna bağlı) |
| 4.2 | Erişilebilirlik (skip-to-content, focus-visible, aria-label, nav landmark) | Site | ✅ |
| 4.3 | CSP + X-Frame-Options + Referrer-Policy + Permissions-Policy | Hosting | ✅ |
| 4.4 | Structured Data: Organization, BreadcrumbList, Product aggregateRating | Site | ✅ |
| 4.5 | A/B testing altyapısı | Site | ⬜ |

---

## UYGULAMA DETAYLARI — FAZ 1

### 1.1 + 1.2: Cookie Consent Banner

**Mevcut durum:**
- `src/components/CookieConsent.tsx` — mevcut ama basit
- `src/utils/cookieConsent.ts` — `canLoadAnalytics()`, `canLoadMarketing()` fonksiyonları hazır ama hiçbir yere bağlı değil

**Yapılacaklar:**
- CookieConsent bileşenini KVKK uyumlu hale getir
- 3 kategori: Zorunlu (her zaman aktif), Analitik (opt-in), Pazarlama (opt-in)
- Pre-checked kutular OLMAYACAK (KVKK ihlali)
- "Tümünü Kabul Et" + "Tercihlerimi Yönet" + "Reddet" butonları
- Tercih değişikliğinde script'leri dinamik yükle/kaldır
- localStorage'da tercih kaydı (mevcut yapı korunacak)

### 1.3: Meta Pixel Entegrasyonu

**Yaklaşım:** Manuel `window.fbq` (en güvenilir, bağımlılık yok)

**Yapılacaklar:**
- `src/services/metaPixelService.ts` oluştur
- Pixel SDK'yı cookie consent onayından SONRA yükle
- `canLoadMarketing()` kontrolü ile koşullu yükleme
- Pixel ID → `.env` dosyasından (`VITE_META_PIXEL_ID`)
- `fbp` ve `fbc` cookie yönetimi

### 1.4: Temel Pixel Event'leri

**Event → Bileşen eşleştirmesi:**

| Event | Tetiklendiği Yer | Dosya |
|-------|-------------------|-------|
| PageView | Route değişiminde | App.tsx (useLocation) |
| ViewContent | Ürün detay açıldığında | ProductDetail.tsx |
| AddToCart | Sepete ekle tıklandığında | CartContext.tsx |
| InitiateCheckout | Checkout sayfası açıldığında | Checkout.tsx |
| Purchase | Sipariş tamamlandığında | Checkout.tsx (onay sayfası) |

**Her event'e dahil edilecek parametreler:**
- `content_ids` (ürün ID'leri)
- `content_type`: 'product'
- `value` + `currency`: 'TRY'
- `event_id`: UUID (deduplication için)

---

## TEKNİK NOTLAR

- **Meta Pixel "pazarlama" çerezi** → KVKK gereği onay olmadan yüklenemez
- **React 19 uyumu:** react-helmet-async uyumsuz, native document.title kullanılıyor (mevcut SEOHead.tsx)
- **Bean-to-bar ifadesi kesinlikle kullanılmayacak** (Sade Chocolate üretici değil)
- **Pixel ID henüz yok** — Meta projesinden gelecek, şimdilik .env placeholder

---

## BAĞIMLILIKLAR

| Bu Projede (Site) | Meta Projesinde |
|-------------------|-----------------|
| Cookie consent banner | Business Manager oluşturma |
| Pixel SDK yükleme kodu | Pixel ID alma |
| CAPI Cloud Function | Access Token alma |
| Event tracking | Domain doğrulama |

---

*Bu plan, araştırma raporu tamamlandıkça güncellenecektir.*
