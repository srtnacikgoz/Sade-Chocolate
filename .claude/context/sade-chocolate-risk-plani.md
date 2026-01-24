# Sade Chocolate - Risk ve Dayanıklılık Planı

> **Proje Spesifik Risk Değerlendirmesi ve Fallback Stratejileri**

Bu dosya, Sade Chocolate projesinin kritik bağımlılıklarını ve bunlara yönelik risk azaltma stratejilerini içerir.

**İlişkili Dosya:** `../Risk-ve-Dayaniklilik-Plani.md` (Evrensel Metodoloji)

---

## 1. Kritik Bağımlılıklar Haritası

```
┌────────────────────────────────────────────────────────────┐
│                   Sade Chocolate Stack                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                      ┌──────────┐                          │
│                      │  Client  │                          │
│                      │ (React)  │                          │
│                      └────┬─────┘                          │
│                           │                                │
│              ┌────────────┼────────────┐                   │
│              ▼            ▼            ▼                   │
│       ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│       │ Firebase │ │ Cloudflare│ │  Vite    │              │
│       │  Auth    │ │   CDN    │ │  Build   │              │
│       └────┬─────┘ └──────────┘ └──────────┘              │
│            │                                               │
│  ┌─────────┴─────────┬───────────────┐                    │
│  ▼                   ▼               ▼                    │
│ ┌─────────┐    ┌──────────┐    ┌──────────┐               │
│ │Firestore│    │ Functions│    │ Hosting  │               │
│ │   DB    │    │   API    │    │          │               │
│ └────┬────┘    └────┬─────┘    └──────────┘               │
│      │              │                                      │
│      │     ┌────────┴────────┐                            │
│      │     ▼                 ▼                            │
│      │ ┌──────────┐    ┌──────────┐                       │
│      │ │  İyzico  │    │MNG Kargo │                       │
│      │ │ Payment  │    │ Shipping │                       │
│      │ └──────────┘    └──────────┘                       │
│      │                                                     │
│      ▼                                                     │
│ ┌──────────┐                                               │
│ │ SendGrid │                                               │
│ │  Email   │                                               │
│ └──────────┘                                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Risk Matrisi

| Bağımlılık | Tier | Etki | Olasılık | Risk | Fallback Durumu |
|------------|------|------|----------|------|-----------------|
| **Firebase Auth** | 1 | Kritik | Düşük | ⚠️ Orta | ❌ Yok |
| **Firestore DB** | 1 | Kritik | Düşük | ⚠️ Orta | ❌ Yok |
| **İyzico** | 1 | Kritik | Orta | 🔴 Yüksek | ✅ Havale/EFT |
| **MNG Kargo** | 2 | Önemli | Orta | ⚠️ Orta | ✅ Manuel |
| **SendGrid** | 3 | Düşük | Düşük | 🟢 Düşük | ✅ Firebase Email |
| **Cloudflare** | 2 | Önemli | Düşük | 🟢 Düşük | ✅ Firebase CDN |

---

## 3. Bağımlılık Detay Analizi

### 3.1 Firebase (Auth + Firestore + Functions + Hosting)

**Tier:** 1 - Kritik
**Risk:** ⚠️ Orta (Google altyapısı güvenilir)

| Aspect | Değerlendirme |
|--------|---------------|
| **Vendor Stability** | Google - çok stabil |
| **SLA** | 99.95% uptime |
| **Lock-in Seviyesi** | Yüksek |
| **Data Portability** | Orta (export mümkün) |
| **Pricing Risk** | Düşük (Spark → Blaze predictable) |

**Riskler:**
- Firestore sorgu maliyetleri beklenmedik artabilir
- Firebase Functions cold start gecikmeleri
- Quota limits (günlük email, function invocations)

**Mevcut Önlemler:**
- ✅ Firestore security rules
- ✅ Functions timeout ve memory config
- ❌ Automatic backup (YOK - EKLENMELİ)
- ❌ Multi-region (YOK)

**Aksiyon Planı:**
1. [ ] Haftalık otomatik Firestore backup scripti
2. [ ] Read/Write monitoring dashboard
3. [ ] Quota alerting kurulumu

---

### 3.2 İyzico (Ödeme İşleme)

**Tier:** 1 - Kritik
**Risk:** 🔴 Yüksek (Ödeme alınamazsa sipariş alınamaz)

| Aspect | Değerlendirme |
|--------|---------------|
| **Vendor Stability** | Stabil (PayU bünyesinde) |
| **SLA** | 99.9% |
| **Lock-in Seviyesi** | Orta |
| **Data Portability** | N/A |
| **Pricing Risk** | Orta (komisyon oranları değişebilir) |

**Riskler:**
- API downtime → Satış kaybı
- 3D Secure callback failures
- Komisyon oranı artışı
- Türk lirası kur dalgalanmaları

**Mevcut Önlemler:**
- ✅ Havale/EFT alternatif ödeme
- ✅ Callback retry mekanizması
- ✅ Transaction logging
- ❌ İkinci payment provider (YOK)

**Fallback Stratejisi:**
```
İyzico API → Başarısız → "Havale/EFT ile ödeme" seçeneği göster
                ↓
            Manuel sipariş onayı
```

**Aksiyon Planı:**
1. [ ] İyzico status monitoring
2. [ ] Alternatif: Param veya PayTR entegrasyonu araştır
3. [ ] Kapıda ödeme seçeneği değerlendir (MNG ile)

---

### 3.3 MNG Kargo (Gönderi ve Takip)

**Tier:** 2 - Önemli
**Risk:** ⚠️ Orta

| Aspect | Değerlendirme |
|--------|---------------|
| **Vendor Stability** | Orta (DHL satın aldı) |
| **SLA** | Tanımsız |
| **Lock-in Seviyesi** | Düşük |
| **API Reliability** | Orta (zaman zaman sorunlu) |

**Riskler:**
- API erişim sorunları (onay bekliyor)
- Breaking API changes
- Kargo fiyat artışları
- Teslimat gecikmeleri

**Mevcut Önlemler:**
- ✅ Manuel kargo oluşturma fallback
- ✅ Takip numarası manuel giriş
- ❌ Alternatif kargo firması entegrasyonu (YOK)

**Fallback Stratejisi:**
```
MNG API → Başarısız → Manuel mod aktif
            ↓
       1. Kargo bilgilerini indir
       2. MNG paneline manuel gir
       3. Takip numarasını sisteme işle
```

**Aksiyon Planı:**
1. [x] MNG API onayı bekle
2. [ ] Yurtiçi Kargo alternatif olarak değerlendir
3. [ ] Aras Kargo fiyat teklifi al

---

### 3.4 SendGrid (Email Gönderimi)

**Tier:** 3 - Nice-to-have
**Risk:** 🟢 Düşük

| Aspect | Değerlendirme |
|--------|---------------|
| **Vendor Stability** | Çok stabil (Twilio) |
| **SLA** | 99.95% |
| **Lock-in Seviyesi** | Çok düşük |
| **Pricing** | Free tier yeterli |

**Riskler:**
- Email deliverability sorunları
- Spam filtreleri
- Daily limit aşımı

**Mevcut Önlemler:**
- ✅ Firebase Trigger Email extension
- ✅ Mail queue (firestore collection)
- ✅ Retry mekanizması

**Fallback Stratejisi:**
```
SendGrid → Başarısız → Firebase "mail" collection'da beklet
                ↓
           Admin panelden manuel kontrol
                ↓
           Gerekirse manual email gönder
```

---

### 3.5 Cloudflare (CDN + DNS + SSL)

**Tier:** 2 - Önemli
**Risk:** 🟢 Düşük

| Aspect | Değerlendirme |
|--------|---------------|
| **Vendor Stability** | Çok stabil |
| **SLA** | 100% (Enterprise), 99.9% (Free) |
| **Lock-in Seviyesi** | Düşük |

**Riskler:**
- DNS propagation sorunları
- SSL certificate yenileme
- Cache invalidation

**Mevcut Önlemler:**
- ✅ Firebase Hosting backup CDN
- ✅ Auto SSL renewal
- ❌ Multi-CDN setup (YOK)

---

## 4. Acil Durum Prosedürleri

### Senaryo 1: İyzico Down

```
1. Admin panelden "Havale/EFT" seçeneğini öne çıkar
2. Checkout sayfasına banner ekle: "Kredi kartı ile ödeme geçici olarak kullanılamıyor"
3. Havale bilgilerini net göster
4. Sipariş onaylarını manuel takip et
5. İyzico status page'i monitor et
6. Normale dönünce banner'ı kaldır
```

### Senaryo 2: Firebase Outage

```
1. Firebase status page kontrol: https://status.firebase.google.com
2. Downtime süresi tahmini
3. Sosyal medyadan müşterilere bilgi ver
4. Kritikse: Statik "bakım" sayfası deploy et
5. Firebase normale dönünce cache'leri temizle
```

### Senaryo 3: MNG Kargo API Erişilemez

```
1. Manuel moda geç (otomatik fallback mevcut)
2. MNG paneline doğrudan giriş yap
3. Bekleyen siparişleri manuel oluştur
4. Takip numaralarını sisteme gir
5. Müşterilere bildirim gönder
```

---

## 5. Monitoring Checklist

### Günlük Kontroller
- [ ] Firebase console - error logs
- [ ] İyzico merchant panel - başarısız işlemler
- [ ] Email queue - bekleyen mailler
- [ ] Order status - "pending" siparişler

### Haftalık Kontroller
- [ ] Firebase usage/billing
- [ ] API response times
- [ ] Error rate trends
- [ ] Customer complaints

### Aylık Kontroller
- [ ] Vendor changelog'ları
- [ ] Security updates
- [ ] Performance baseline karşılaştırması
- [ ] Backup test

---

## 6. Öncelikli Aksiyon Listesi

### Kısa Vadeli (1-2 Hafta)
1. [ ] MNG API onayı sonrası entegrasyonu tamamla
2. [ ] Firebase Firestore backup scripti oluştur
3. [ ] Error monitoring dashboard kur

### Orta Vadeli (1-3 Ay)
1. [ ] Alternatif kargo firması entegrasyonu araştır
2. [ ] Kapıda ödeme seçeneği ekle (MNG ile)
3. [ ] Alternatif payment provider (Param/PayTR) POC

### Uzun Vadeli (6+ Ay)
1. [ ] Multi-region Firebase setup değerlendir
2. [ ] Headless CMS migration (vendor lock-in azaltma)
3. [ ] Email soyutlama katmanı

---

## 7. İletişim Planı

### Kritik Arıza Durumunda

| Kanal | İçerik | Timing |
|-------|--------|--------|
| Site Banner | Kısa bilgilendirme | İlk 5 dk |
| Instagram Story | Detaylı açıklama | İlk 30 dk |
| Email (manuel) | Etkilenen müşterilere | İlk 1 saat |
| WhatsApp Business | VIP müşterilere | Kritik siparişler için |

### Şablon Mesajlar

**Site Banner:**
> Teknik bir sorun nedeniyle [ödeme/kargo] işlemlerinde geçici aksaklık yaşanmaktadır. En kısa sürede çözüme ulaşılacaktır.

**Sosyal Medya:**
> Değerli müşterilerimiz, teknik altyapımızda yaşanan geçici bir sorun nedeniyle [işlem türü] şu an yapılamamaktadır. Ekibimiz sorunu çözmek için çalışmaktadır. Anlayışınız için teşekkür ederiz. 🍫

---

*Son Güncelleme: Ocak 2026*
*Proje: Sade Chocolate*
