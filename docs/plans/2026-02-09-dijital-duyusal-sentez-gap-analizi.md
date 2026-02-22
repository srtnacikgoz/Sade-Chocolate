# Dijital Duyusal Sentez - Gap Analizi ve Uygulama Planı

> **Kaynak:** "Dijital Duyusal Sentez: Premium Çikolata E-ticaretinde Deneyim ve Performans Stratejileri" araştırma raporu
> **Tarih:** 9 Şubat 2026

---

## Mevcut Durum vs Rapor Önerileri

### 1. Görsel & Performans

| Öneri | Durum | Detay |
|-------|-------|-------|
| Makro fotoğrafçılık / zoom | ⚠️ Kısmen | Galeri var, hover scale var, ama pinch-zoom yok |
| WebP/AVIF format | ❌ Yok | Tüm görseller orijinal format |
| srcset / responsive images | ❌ Yok | Tek kaynak görsel |
| `<link rel="preload">` hero görsel | ❌ Yok | index.html'de preload yok |
| Lazy loading | ❌ Yok | `loading="lazy"` kullanılmıyor |
| LCP < 2.5s hedefi | ❌ Ölçülmedi | Görsel optimizasyon olmadan zor |
| Font subsetting | ❌ Yok | Playfair Display tam yükleniyor |

### 2. Renk Psikolojisi

| Öneri | Durum | Detay |
|-------|-------|-------|
| Sıcak ton keşif + soğuk ton checkout | ⚠️ Kısmen | mocha/cream/gold paleti tutarlı ama checkout'ta farklılaşma yok |
| Kampanya/sezon renkleri | ❌ Yok | Tek palet, dinamik tema yok |
| Checkout'ta premium siyah tonlar | ❌ Yok | Checkout aynı cream arka plan |

### 3. Mikro-Etkileşimler

| Öneri | Durum | Detay |
|-------|-------|-------|
| Hover scale efektleri | ✅ Var | `group-hover:scale-110 duration-700` |
| Hover'da dolgu gösterimi (praline iç) | ❌ Yok | alternateImage var ama dolgu görseli değil |
| Scroll-triggered animasyonlar | ❌ Yok | Elementler statik |
| Sepete ekleme animasyonu | ⚠️ Basit | `active:scale-95` var, özel animasyon yok |
| Parallax hero | ❌ Yok | |

### 4. Hediye Akışı (Gifting Flow)

| Öneri | Durum | Detay |
|-------|-------|-------|
| Hediye toggle | ✅ Var | `isGift` state, CartContext |
| Dinamik etiketleme (Alıcı Adresi) | ❌ Yok | Etiketler statik |
| Fiyat gizleme seçeneği | ✅ Var | `hideInvoice` state |
| Hediye notu | ✅ Var | 200 karakter, metin girişi |
| Not önizleme (kart üzerinde) | ❌ Yok | Sadece text preview |
| Çoklu adres gönderimi (Multiship) | ❌ Yok | Tek adres |
| Gönderim zamanlama (send later) | ❌ Yok | |
| Alıcı/Gönderici ayrı bildirim | ❌ Yok | Tek bildirim akışı |

### 5. Bilgi Mimarisi (PDP)

| Öneri | Durum | Detay |
|-------|-------|-------|
| Görsel katman (doku odaklı) | ✅ Var | Galeri + video desteği |
| Özet bilgi (isim, fiyat) | ✅ Var | Badge, başlık, fiyat |
| Duyusal tanım (tadım notları) | ✅ Var | Sensory radar chart + açıklama |
| Bitter oranı (kakao %) | ❌ Yok | Sensory intensity var ama explicit % yok |
| Köken bilgisi (origin) | ✅ Var | Kategori + origin auto-merge |
| Alerjen bilgisi (ikonlu) | ⚠️ Kısmen | Text var, ikon yok, ayrı bölüm var |
| Besin değerleri tablosu | ⚠️ Kısmen | NutritionalInfo var ama makro/GDA yok |
| Sertifika badge'leri | ❌ Yok | 3 statik badge hardcoded |

### 6. Paketleme & Lojistik Güveni

| Öneri | Durum | Detay |
|-------|-------|-------|
| Soğuk zincir ikonu | ⚠️ Kısmen | ShippingInfo'da termal izolasyon metni var |
| Kutu içi görsel (izolasyon katmanları) | ❌ Yok | Paketleme fotoğrafı yok |
| Unboxing lifestyle görselleri | ❌ Yok | |
| Hasar garantisi badge | ⚠️ Kısmen | ShippingInfo'da metin var |
| Sıcaklık uyarı sistemi | ✅ Var | weatherService + blackout days |

### 7. Mobil UX

| Öneri | Durum | Detay |
|-------|-------|-------|
| Alt navigasyon (BottomNav) | ✅ Var | fixed bottom-0, pb-safe |
| Sticky CTA (Sepete Ekle) | ❌ Yok | PDP'de scroll gerekiyor |
| 48px min tap target | ⚠️ Kısmen | Bazı butonlar küçük |
| Step-by-step checkout | ✅ Var | Adım 1: Teslimat, Adım 2: Ödeme |
| Swipe image gallery | ❌ Yok | Click-based gallery |

### 8. Abonelik Modeli

| Öneri | Durum | Detay |
|-------|-------|-------|
| Hibrit model (tercih + sürpriz) | ✅ Backend var | subscriptionService.ts (775 satır) |
| 3 farklı plan | ✅ Backend var | Tadım Yolculuğu, Gurme Seçki, Klasik |
| Frontend UI | ❌ Yok | Hiçbir abonelik sayfası/bileşeni yok |
| Recurring payment | ❌ Yok | Manuel ödeme kaydı |
| Müşteri dashboard | ❌ Yok | Yönetim paneli yok |

---

## Öncelik Sıralaması

### P0 - Hemen (Performans & Temel UX)
1. **Görsel optimizasyon:** WebP/AVIF, lazy loading, srcset, hero preload
2. **Mobil sticky CTA:** PDP'de sabit "Sepete Ekle" butonu
3. **Alerjen ikonları:** Text yerine görsel ikonlar

### P1 - Kısa Vade (Dönüşüm Artırıcı)
4. **Hediye akışı iyileştirme:** Dinamik etiketler, kart önizleme
5. **Checkout renk farklılaştırma:** Premium tonlar, güven badge'leri
6. **Bitter oranı (kakao %):** Ürün verisine alan ekle, PDP'de göster

### P2 - Orta Vade (Deneyim Zenginleştirme)
7. **Mikro-etkileşimler:** Scroll animasyonlar, sepet animasyonu
8. **Paketleme görselleri:** Kutu açılış fotoğrafları, soğuk zincir badge
9. **Swipe gallery:** Mobil görsel kaydırma

### P3 - Uzun Vade (Büyüme)
10. **Abonelik frontend:** Plan seçim sayfası, müşteri dashboard
11. **Çoklu adres gönderimi:** Kurumsal hediye desteği
12. **Font optimizasyonu:** Subset, display swap

---

## Notlar
- Meta Pixel ve tracking konuları ayrı projede yönetiliyor
- "Bean-to-bar" ifadesi raporda geçiyor ama Sade Chocolate için KULLANILMAYACAK
- Compartes vs Hotel Chocolat karşılaştırması referans olarak değerli
