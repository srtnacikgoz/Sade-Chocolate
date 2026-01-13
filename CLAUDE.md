# Sade Chocolate - Claude Code Kılavuzu

## Oturum Başlangıcı

**Her oturum başında oku:**
1. `.claude/kişiselbağlam.md` - İletişim tercihleri
2. `.claude/hedefler.md` - Aktif görevler

---

## Kritik Kurallar

### Onay Gerektiren İşlemler
Aşağıdaki işlemlerden önce **mutlaka onay al:**
- `npm run build`
- `firebase deploy`
- `git push`
- Dosya silme (özellikle toplu)
- Destructive database işlemleri

### Kod Standartları
- **Dosya limiti:** Max 500 satır (ideal: 300-450)
- **Z-Index:** Sticky: 100 | Overlay: 500 | Modal: 1000 | Popover: 1500 | Toast: 2000
- **Köşeler:** Ana elementler: `rounded-[32px]` | Kartlar: `rounded-2xl`
- Türkçe UI, Türkçe yorumlar

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (özel palet) |
| Backend | Firebase (Firestore + Auth + Functions) |
| Ödeme | İyzico (3D Secure) + Havale/EFT |
| Email | SendGrid (Firebase Extensions) |
| Kargo | MNG Kargo API |
| CDN | Cloudflare |

---

## Tailwind Renk Paleti

**Kullanılabilir:**
- `cream-*`, `mocha-*`, `gold-*`, `brown-*`, `dark-*`, `brand-*`

**Brand Renkleri:**
| İsim | Hex |
|------|-----|
| Brand Blue | #a4d1e8 |
| Brand Yellow | #e7c57d |
| Brand Mustard | #d4a945 |
| Brand Green | #a4d4bc |
| Brand Peach | #f3d1c8 |
| Brand Orange | #e59a77 |

**UYARI:** `chocolate-*` renkleri tanımlı DEĞİL!

---

## Firebase Collections

| Koleksiyon | Açıklama |
|------------|----------|
| `products` | Ürünler |
| `orders` | Siparişler |
| `customers` | Müşteriler |
| `site_settings/*` | Site ayarları |
| `settings/*` | Uygulama ayarları |
| `mail` | Email queue |

---

## Cloud Functions

| Fonksiyon | Açıklama |
|-----------|----------|
| `createIyzicoPayment` | Ödeme formu |
| `iyzicoCallback` | 3D Secure callback |
| `createShipment` | MNG Kargo gönderi |
| `trackShipment` | Kargo takip |

---

## Best Practices

1. **Silme işlemlerinde** Firestore + local state birlikte güncelle
2. **Tehlikeli işlemlerde** AlertDialog ile onay al
3. **Email hataları** console'a logla, kullanıcıya gösterme
4. **Boş state** için anlamlı mesaj göster
5. **BrandIcon** kullan (Sparkles yerine)

---

## Kurumsal Bilgiler

- **Ünvan:** Sade Unlu Mamülleri San ve Tic Ltd Şti
- **Adres:** Yeşilbahçe mah. Çınarlı cd 47/A Muratpaşa Antalya
- **Vergi:** Antalya Kurumlar VD / 7361500827
