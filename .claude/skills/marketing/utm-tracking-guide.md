---
name: utm-tracking-guide
description: UTM parametreleri ve analytics takip rehberi
---

# UTM Tracking Rehberi

## Ne Zaman Kullan

- Pazarlama linki oluştururken
- Kampanya performansı takip ederken
- Kanal bazlı analiz yaparken
- Reklam etkinliğini ölçerken
- Influencer performansı izlerken

---

## UTM Parametreleri

### Temel Parametreler

| Parametre | Açıklama | Zorunlu |
|-----------|----------|---------|
| `utm_source` | Trafiğin geldiği platform | ✅ Evet |
| `utm_medium` | Pazarlama kanalı tipi | ✅ Evet |
| `utm_campaign` | Kampanya adı | ✅ Evet |
| `utm_content` | İçerik/reklam versiyonu | ⚪ Opsiyonel |
| `utm_term` | Anahtar kelime (PPC) | ⚪ Opsiyonel |

---

## Sade Chocolate UTM Sözlüğü

### utm_source Değerleri

| Değer | Kullanım |
|-------|----------|
| `facebook` | Facebook reklamları |
| `instagram` | Instagram (organik + paid) |
| `google` | Google Ads |
| `email` | Email kampanyaları |
| `influencer` | Influencer işbirlikleri |
| `whatsapp` | WhatsApp paylaşımları |
| `qrcode` | QR kod taramaları |
| `direct` | Direkt linkler |

### utm_medium Değerleri

| Değer | Açıklama |
|-------|----------|
| `paid` | Ücretli reklam |
| `organic` | Organik sosyal medya |
| `email` | Email pazarlama |
| `influencer` | Influencer içeriği |
| `referral` | Referans/affiliate |
| `cpc` | Tıklama başına ödeme |
| `display` | Display reklamlar |

### utm_campaign Formatı

**Format:** `[olay]-[yil]` (küçük harf, tire ile)

| Kampanya | Değer |
|----------|-------|
| Sevgililer Günü 2026 | `sevgililergunu-26` |
| Anneler Günü 2026 | `annelergunu-26` |
| Ramazan 2026 | `ramazan-26` |
| Black Friday 2026 | `blackfriday-26` |
| Yılbaşı 2026 | `yilbasi-26` |
| Genel (yıl boyunca) | `genel-26` |
| Retargeting | `retargeting` |
| Yeni ürün lansmanı | `lansman-[urun]` |

### utm_content Değerleri

**Format:** `[format]-[aciklama]` (küçük harf)

| Değer | Kullanım |
|-------|----------|
| `carousel-products` | Carousel ürün reklamı |
| `video-brand` | Marka videosu |
| `stories-promo` | Stories reklam |
| `reels-unboxing` | Reels içerik |
| `post-hero` | Ana ürün postu |
| `banner-homepage` | Site banner |
| `button-cta` | CTA butonu |
| `link-bio` | Bio linki |

---

## Hazır UTM Şablonları

### Instagram

**Bio Link:**
```
https://sadechocolate.com/?utm_source=instagram&utm_medium=organic&utm_campaign=genel-26&utm_content=link-bio
```

**Stories Swipe-up (Organik):**
```
https://sadechocolate.com/urun/[slug]?utm_source=instagram&utm_medium=organic&utm_campaign=[kampanya]-26&utm_content=stories-swipeup
```

**Reels Link:**
```
https://sadechocolate.com/?utm_source=instagram&utm_medium=organic&utm_campaign=[kampanya]-26&utm_content=reels-link
```

### Meta Ads (Facebook/Instagram)

**Feed Carousel:**
```
https://sadechocolate.com/?utm_source=facebook&utm_medium=paid&utm_campaign=[kampanya]-26&utm_content=carousel-products
```

**Stories Reklam:**
```
https://sadechocolate.com/?utm_source=instagram&utm_medium=paid&utm_campaign=[kampanya]-26&utm_content=stories-promo
```

**Retargeting:**
```
https://sadechocolate.com/?utm_source=facebook&utm_medium=paid&utm_campaign=retargeting&utm_content=cart-abandonment
```

### Email

**Newsletter:**
```
https://sadechocolate.com/?utm_source=email&utm_medium=email&utm_campaign=newsletter-[ay][yil]&utm_content=[konu]
```

**Promosyon Maili:**
```
https://sadechocolate.com/?utm_source=email&utm_medium=email&utm_campaign=[kampanya]-26&utm_content=promo-button
```

**Abandoned Cart:**
```
https://sadechocolate.com/sepet?utm_source=email&utm_medium=email&utm_campaign=abandonedcart&utm_content=recover-button
```

### Influencer

**Influencer Linki:**
```
https://sadechocolate.com/?utm_source=influencer&utm_medium=influencer&utm_campaign=[influencer-adi]&utm_content=stories
```

**Influencer Promo Kodu Sayfası:**
```
https://sadechocolate.com/?utm_source=influencer&utm_medium=influencer&utm_campaign=[influencer-adi]&utm_content=bio-link
```

### QR Kod

**Paket İçi QR:**
```
https://sadechocolate.com/?utm_source=qrcode&utm_medium=offline&utm_campaign=packaging&utm_content=thankyou-card
```

**Etkinlik QR:**
```
https://sadechocolate.com/?utm_source=qrcode&utm_medium=offline&utm_campaign=event-[etkinlik]&utm_content=booth
```

---

## Link Oluşturma

### Manuel Oluşturma

**Base URL:**
```
https://sadechocolate.com/
```

**Parametre Ekleme:**
```
?utm_source=[kaynak]&utm_medium=[medium]&utm_campaign=[kampanya]&utm_content=[icerik]
```

### Google Campaign URL Builder

Link: https://ga-dev-tools.google/campaign-url-builder/

1. Website URL gir
2. Parametreleri doldur
3. Link'i kopyala

### Link Kısaltma

**Uzun link kullanma durumları:**
- Meta Ads: Tam UTM kullan (pixel için)
- Email: Tam UTM kullan (tracking için)
- QR kod: Tam UTM kullan

**Kısaltılmış link kullanma:**
- Instagram bio: bit.ly veya benzeri
- Stories: Kısa link daha temiz
- Print materyaller: QR kod tercih et

---

## Google Analytics 4 Entegrasyonu

### Temel Metrikler

| Metrik | Açıklama |
|--------|----------|
| Sessions | Ziyaret sayısı |
| Users | Tekil kullanıcı |
| Engagement Rate | Etkileşim oranı |
| Conversions | Dönüşümler |
| Revenue | Gelir |

### GA4'te Görüntüleme

**Path:** Reports > Acquisition > Traffic Acquisition

**Filtreleme:**
- Source: utm_source değerine göre
- Medium: utm_medium değerine göre
- Campaign: utm_campaign değerine göre

### Custom Report

```
Boyutlar:
- Session source
- Session medium
- Session campaign

Metrikler:
- Sessions
- Engaged sessions
- Total revenue
- Transactions
```

---

## Kampanya Bazlı Tracking

### Kampanya Öncesi Hazırlık

1. **UTM listesi hazırla:**
   - Tüm kanal linklerini oluştur
   - Spreadsheet'e kaydet
   - Ekiple paylaş

2. **Analytics hedefleri ayarla:**
   - Conversion tracking aktif
   - E-commerce tracking aktif
   - Custom events tanımlı

### Örnek Kampanya UTM Seti

**Kampanya: Sevgililer Günü 2026**

| Kanal | Link |
|-------|------|
| Instagram Bio | `?utm_source=instagram&utm_medium=organic&utm_campaign=sevgililergunu-26&utm_content=link-bio` |
| Instagram Stories | `?utm_source=instagram&utm_medium=organic&utm_campaign=sevgililergunu-26&utm_content=stories-swipeup` |
| Meta Ads - Carousel | `?utm_source=facebook&utm_medium=paid&utm_campaign=sevgililergunu-26&utm_content=carousel-gift` |
| Meta Ads - Retargeting | `?utm_source=facebook&utm_medium=paid&utm_campaign=sevgililergunu-26&utm_content=retargeting` |
| Email - Launch | `?utm_source=email&utm_medium=email&utm_campaign=sevgililergunu-26&utm_content=launch-email` |
| Email - Reminder | `?utm_source=email&utm_medium=email&utm_campaign=sevgililergunu-26&utm_content=reminder-email` |
| Influencer - @isim | `?utm_source=influencer&utm_medium=influencer&utm_campaign=sevgililergunu-26&utm_content=influencer-isim` |

---

## En İyi Uygulamalar

### Naming Conventions

1. **Küçük harf kullan** - `sevgililergunu` not `SevgililerGunu`
2. **Tire kullan** - `black-friday` not `black_friday` or `blackfriday`
3. **Türkçe karakter kullanma** - `sevgililergunu` not `sevgililergunü`
4. **Tutarlı ol** - Aynı formatta devam et
5. **Kısa ve açıklayıcı** - `carousel-products` not `carousel-all-products-january`

### Yaygın Hatalar

❌ **Hata:** Her defasında farklı format
```
utm_campaign=Sevgililer Günü 2026
utm_campaign=sevgililergunu26
utm_campaign=valentines_day
```

✅ **Doğru:** Tutarlı format
```
utm_campaign=sevgililergunu-26
```

❌ **Hata:** UTM parametresi eksik
```
https://sadechocolate.com/  (tracking yok!)
```

✅ **Doğru:** Tüm pazarlama linklerinde UTM
```
https://sadechocolate.com/?utm_source=...&utm_medium=...&utm_campaign=...
```

---

## UTM Tracking Checklist

Kampanya başlamadan önce kontrol et:

- [ ] Tüm kanal linkleri oluşturuldu mu?
- [ ] UTM parametreleri tutarlı mı?
- [ ] Linkler test edildi mi? (404 yok)
- [ ] GA4'te kampanya görünüyor mu?
- [ ] Link listesi kayıt altında mı?

---

## Raporlama

### Haftalık Kontrol

- Kanal bazlı trafik
- Kampanya performansı
- Top performing content
- Conversion oranları

### Kampanya Sonu Raporu

```markdown
# [Kampanya] UTM Performans Raporu

## Kanal Performansı

| Kanal | Sessions | Conversions | Revenue |
|-------|----------|-------------|---------|
| Instagram Organic | X | X | X TL |
| Meta Ads | X | X | X TL |
| Email | X | X | X TL |
| Influencer | X | X | X TL |

## En İyi Performans

- En çok trafik: [utm_content]
- En çok dönüşüm: [utm_content]
- En iyi ROAS: [kanal]

## Öğrenilenler

- [...]
```

---

## İlgili Dosyalar

- `.claude/skills/marketing/meta-ads-workflow.md` - Meta Ads UTM kullanımı
- `.claude/skills/marketing/email-marketing-workflow.md` - Email UTM kullanımı
- `.claude/skills/marketing/influencer-workflow.md` - Influencer link tracking
- `.claude/skills/marketing/campaign-planning-workflow.md` - Kampanya entegrasyonu
