---
name: email-marketing-workflow
description: Email pazarlama kampanyaları ve SendGrid entegrasyonu
---

# Email Marketing Workflow

## Ne Zaman Kullan

- Email kampanyası planlarken
- Newsletter hazırlarken
- Promosyon emaili gönderirken
- Abandoned cart stratejisi oluştururken
- Email listesi segmentasyonu yaparken

---

## Email Türleri

### 1. Newsletter (Haber Bülteni)

**Amaç:** Marka bilinirliği, engagement
**Sıklık:** Ayda 1-2 kez
**İçerik:** Haberler, yeni ürünler, ipuçları

**Örnek Yapı:**
```
- Başlık görseli
- Karşılama mesajı
- Yeni ürün tanıtımı
- Çikolata ipucu/tarif
- Sosyal medya CTA
- Footer
```

### 2. Promosyon Emaili

**Amaç:** Satış, dönüşüm
**Sıklık:** Kampanya bazlı
**İçerik:** İndirimler, özel teklifler

**Örnek Yapı:**
```
- Hero görsel + teklif
- Ürün görselleri
- Kampanya detayları
- CTA buton
- Süre bilgisi (aciliyet)
- Footer
```

### 3. Abandoned Cart (Sepet Hatırlatma)

**Amaç:** Kaybedilen satışı geri kazanma
**Zamanlama:**
- 1. email: 1 saat sonra
- 2. email: 24 saat sonra
- 3. email: 72 saat sonra (indirimli)

**Örnek Yapı:**
```
- "Sepetiniz sizi bekliyor" başlık
- Sepetteki ürün görselleri
- "Alışverişi Tamamla" CTA
- Müşteri hizmetleri iletişim
```

### 4. Sipariş Bildirimleri (Transactional)

| Email Tipi | Tetikleyici |
|------------|-------------|
| Sipariş Onayı | Ödeme tamamlandığında |
| Kargo Bildirimi | Kargo oluşturulduğunda |
| Teslimat Bildirimi | Teslim edildiğinde |

### 5. Re-engagement (Yeniden Aktivasyon)

**Amaç:** Pasif müşterileri geri kazanma
**Hedef:** 90+ gün alışveriş yapmayan
**Teklif:** Özel indirim kodu

---

## Segmentasyon Stratejisi

### Temel Segmentler

| Segment | Tanım | Email Tipi |
|---------|-------|------------|
| Yeni Abone | Henüz alışveriş yapmamış | Hoşgeldin + teklif |
| İlk Müşteri | 1 alışveriş yapmış | Teşekkür + öneri |
| Sadık Müşteri | 3+ alışveriş | VIP teklifler |
| Pasif Müşteri | 90+ gün alışveriş yok | Re-engagement |
| Sepet Bırakanlar | Sepette ürün var | Abandoned cart |

### VIP Müşteri Kriterleri

- 3+ alışveriş VEYA
- 1000+ TL toplam harcama VEYA
- Son 6 ayda 2+ alışveriş

### Segmentasyon Verileri

```
Firestore'dan çekilecek:
- orders koleksiyonu
- Son sipariş tarihi
- Toplam sipariş sayısı
- Toplam harcama tutarı
```

---

## SendGrid Entegrasyonu

### Firebase Extension

Sade Chocolate, Firebase Extension ile SendGrid kullanır.

**Nasıl Çalışır:**
1. `mail` koleksiyonuna doküman ekle
2. Extension otomatik gönderir
3. Delivery status güncellenir

### Email Gönderme (Kod)

```typescript
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Template kullanarak
const sendEmail = async (to: string, templateId: string, data: object) => {
  const mailRef = collection(db, 'mail')
  await addDoc(mailRef, {
    to,
    template: {
      name: templateId,
      data: data
    }
  })
}

// Örnek: Kampanya emaili
await sendEmail('musteri@email.com', 'promo-campaign', {
  customerName: 'Ahmet',
  campaignTitle: 'Sevgililer Günü Özel',
  discountCode: 'SADE-SEVGILI-26',
  products: [...]
})
```

### Template ID'leri

| Template | ID | Kullanım |
|----------|-----|----------|
| Sipariş Onayı | `order-confirmation` | Transactional |
| Kargo Bildirimi | `shipping-notification` | Transactional |
| Newsletter | `newsletter-template` | Marketing |
| Promosyon | `promo-campaign` | Marketing |
| Abandoned Cart | `cart-reminder` | Marketing |
| Re-engagement | `win-back` | Marketing |

---

## Email İçerik Standartları

### Subject Line (Konu Satırı)

**Kurallar:**
- Max 50 karakter (mobil görünüm için)
- Açık ve merak uyandırıcı
- Emoji kullan (ama abartma)
- A/B test yap

**Örnekler:**

| Tip | Örnek |
|-----|-------|
| İndirim | 🎁 %20 İndirim Fırsatı! |
| Yeni Ürün | 🍫 Yeni Lezzetimiz: Fıstıklı Bitter |
| Aciliyet | ⏰ Son 24 Saat! |
| Soru | Çikolata seçiminde yardım ister misiniz? |
| Kişisel | [İsim], sizi özledik! |

### Preheader Text

Konu satırının hemen altında görünen metin.

- Max 100 karakter
- Subject line'ı tamamlamalı
- CTA ipucu verebilir

**Örnek:**
```
Subject: 🎁 Sevgililer Günü Özel Koleksiyon
Preheader: Şimdi sipariş ver, %15 indirim kazan. Kod: SADE-SEVGILI-26
```

### Email Body

**Yapı:**
1. **Header:** Logo + navigasyon
2. **Hero:** Ana görsel + başlık
3. **Body:** İçerik + ürünler
4. **CTA:** Belirgin buton
5. **Footer:** İletişim + unsubscribe

**Dil ve Ton:**
- Türkçe (hatasız)
- Sıcak ve samimi
- Premium ama erişilebilir
- İkinci tekil kişi ("Siz" değil "Sen" - marka tercihine göre)

### Görsel Standartları

| Element | Boyut | Format |
|---------|-------|--------|
| Header logo | 200px genişlik | PNG |
| Hero image | 600px genişlik | JPG |
| Product images | 200px genişlik | JPG |
| CTA button | Min 44px yükseklik | - |

---

## Kampanya Akışı

### Kampanya Email Serisi

**Örnek: Sevgililer Günü**

| Gün | Email | İçerik |
|-----|-------|--------|
| -14 gün | Teaser | "Sevgililer Günü koleksiyonu geliyor!" |
| -7 gün | Launch | "Koleksiyon yayında! %15 indirim" |
| -3 gün | Reminder | "Kargo için son günler yaklaşıyor" |
| -1 gün | Urgency | "Son şans! Yarın teslim garantisi" |
| +1 gün | Thanks | "Siparişiniz için teşekkürler" |

### Abandoned Cart Serisi

| Saat | Email | İçerik |
|------|-------|--------|
| +1 saat | Hatırlatma 1 | "Sepetinizde ürünler bekliyor" |
| +24 saat | Hatırlatma 2 | "Hâlâ düşünüyor musunuz?" |
| +72 saat | Son teklif | "Size özel %10 indirim" |

---

## Performans Metrikleri

### Temel KPI'lar

| Metrik | Hedef | Açıklama |
|--------|-------|----------|
| Open Rate | %25+ | Email açılma oranı |
| Click Rate | %5+ | Link tıklama oranı |
| Conversion Rate | %2+ | Satışa dönüşüm |
| Unsubscribe Rate | <%0.5 | Abonelik iptal |
| Bounce Rate | <%2 | Hatalı adres |
| Spam Rate | <%0.1 | Spam şikayeti |

### A/B Test

**Test Edilebilecekler:**
- Subject line varyasyonları
- Send time (sabah vs akşam)
- CTA button rengi/metni
- Email uzunluğu
- Görsel vs metin ağırlıklı

**Test Kuralları:**
- Tek değişken test et
- Min 500 alıcı per variant
- 24 saat bekle sonuç için
- Winner'ı dokümante et

### Performans Raporu

```markdown
# Email Kampanya Raporu - [Kampanya Adı]

## Genel Bakış
- Gönderim tarihi: [Tarih]
- Alıcı sayısı: [X]
- Template: [ID]

## Metrikler
| Metrik | Sonuç | Hedef | Durum |
|--------|-------|-------|-------|
| Delivered | X% | 98% | ✅/❌ |
| Open Rate | X% | 25% | ✅/❌ |
| Click Rate | X% | 5% | ✅/❌ |
| Conversions | X | - | - |
| Revenue | X TL | - | - |

## A/B Test Sonuçları
- Variant A: [sonuç]
- Variant B: [sonuç]
- Winner: [A/B]

## Öğrenilenler
- [...]
```

---

## Zamanlama

### En İyi Gönderim Saatleri

| Gün | Optimal Saat | Not |
|-----|--------------|-----|
| Salı | 10:00-11:00 | En iyi gün |
| Çarşamba | 10:00-11:00 | İkinci en iyi |
| Perşembe | 10:00-11:00 | İyi |
| Pazar | 19:00-20:00 | Özel günler için |

### Kaçınılacak Zamanlar

- Pazartesi sabahı (inbox dolu)
- Cuma akşamı (weekend modu)
- Bayram tatilleri
- Gece saatleri

---

## Uyum ve Güvenlik

### KVKK/GDPR Uyumu

- [ ] Opt-in onayı alındı mı?
- [ ] Unsubscribe linki var mı?
- [ ] Şirket bilgileri footer'da mı?
- [ ] Neden aldığı açık mı?

### Email Footer Zorunlu Bilgiler

```
Sade Unlu Mamülleri San ve Tic Ltd Şti
Yeşilbahçe mah. Çınarlı cd 47/A Muratpaşa Antalya
info@sadechocolate.com | 0242 XXX XX XX

Bu emaili [email adresi] adresine gönderiyoruz çünkü
Sade Chocolate bültenine abone oldunuz.

[Abonelikten çık] | [Tercihlerimi güncelle]
```

### Spam Önleme

- Fazla BÜYÜK HARF kullanma
- Çok emoji kullanma
- "Ücretsiz", "Kazan" gibi spam tetikleyicilerden kaçın
- Görsel/metin oranını dengele
- Liste hijyeni yap (bounce'ları temizle)

---

## Kritik Kurallar

1. **"Bean-to-bar" YASAK** - Email içeriğinde kullanma
2. **Doğru ifadeler:** "El yapımı", "Artisan", "Butik"
3. **Türkçe hatasız** - Yazım kontrolü yap
4. **Unsubscribe zorunlu** - Her emailde olmalı
5. **Mobile-first** - Responsive tasarım

---

## Best Practices

1. **Segmente et** - Herkese aynı email gönderme
2. **A/B test** - Subject line'ları sürekli test et
3. **Timing** - Doğru saatte gönder
4. **Kısa tut** - Uzun email okunmuyor
5. **Tek CTA** - Bir email, bir hedef
6. **Liste temizliği** - Bounce'ları düzenli sil
7. **Preview test** - Göndermeden önce test et

---

## İlgili Dosyalar

- `.claude/skills/email-workflow.md` - Transactional email detayları
- `.claude/skills/marketing/campaign-planning-workflow.md` - Kampanya entegrasyonu
- `.claude/skills/marketing/utm-tracking-guide.md` - Email link tracking
- `.claude/rules/firebase.md` - Firestore mail collection
