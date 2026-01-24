# Sade Chocolate - Claude Code Project

## Proje Hakkında

Sade Chocolate, premium el yapımı çikolata satan e-ticaret platformudur.

**ÖNEMLİ:** Sade Chocolate "bean-to-bar" ÜRETİCİSİ DEĞİLDİR!
- ❌ Bean-to-bar ifadesi kesinlikle kullanılmamalı
- ✅ Doğru ifade: "El yapımı", "Artisan", "Butik çikolata"

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (özel renk paleti ile)
- React Router v6

### Backend
- Firebase Firestore (database)
- Firebase Auth (authentication)
- Firebase Functions (serverless)
- Firebase Hosting

### Integrations
- **Ödeme:** İyzico (3D Secure) + Havale/EFT
- **Email:** SendGrid (Firebase Extension)
- **Kargo:** Geliver (primary), MNG Kargo (fallback)
- **CDN:** Cloudflare

---

## Nasıl Çalıştırılır

```bash
# Development
npm run dev

# Build
npm run build

# Deploy (onay gerektirir!)
firebase deploy
```

---

## Kritik Kurallar

### Onay Gerektiren İşlemler
Bu işlemlerden önce **mutlaka kullanıcıdan onay al:**
- `npm run build`
- `firebase deploy`
- `git push`
- Dosya silme (özellikle toplu)
- Destructive database işlemleri

### Kod Standartları
- **Dil:** Türkçe UI + Türkçe yorumlar
- **Dosya limiti:** Max 500 satır (ideal: 300-450)
- **TypeScript:** `any` kullanma, `type` kullan (interface değil)

---

## Claude Code Yapısı

Bu proje Universal Claude Code Setup kullanır:

```
.claude/
├── CLAUDE.md              # Bu dosya - proje genel bakış
├── rules/                 # Her zaman aktif kurallar
│   ├── conventions.md     # Kod standartları
│   ├── styling.md         # Tailwind kuralları
│   ├── firebase.md        # Firestore best practices
│   └── security.md        # Güvenlik kuralları
├── skills/                # İş akışları (ihtiyaç anında)
│   ├── order-workflow.md  # Sipariş işleme
│   ├── email-workflow.md  # Email gönderme
│   └── shipping-workflow.md # Kargo entegrasyonu
├── agents/                # Özel ajanlar
│   └── code-reviewer.md   # Kod inceleme ajanı
├── context/               # Proje context dosyaları
│   ├── hedefler.md        # Aktif hedefler
│   ├── kişiselbağlam.md   # İletişim tercihleri
│   └── ...
└── settings.local.json    # Hooks ve permissions
```

### Kullanım

- **Kod yazarken:** `.claude/rules/` otomatik yüklenir
- **İş akışı için:** `.claude/skills/` ihtiyaç anında kullanılır
- **Kod inceleme:** `@code-reviewer` ile ajan çağır
- **Hooks:** `settings.local.json` ile kritik işlemler kontrollü

---

## Hızlı Referans

### Tailwind Renk Paleti
- ✅ `cream-*`, `mocha-*`, `gold-*`, `brown-*`, `brand-*`
- ❌ `chocolate-*` (tanımlı DEĞİL!)

### Z-Index Hiyerarşisi
- Sticky: `z-[100]`
- Overlay: `z-[500]`
- Modal: `z-[1000]`
- Popover: `z-[1500]`
- Toast: `z-[2000]`

### Border Radius
- Ana elementler: `rounded-[32px]`
- Kartlar: `rounded-2xl`
- Butonlar: `rounded-xl`

### Firebase Collections
- `products`, `orders`, `customers`, `mail`
- `site_settings/*`, `settings/*`

---

## Detaylı Kurallar

Tüm detaylar `.claude/rules/`, `.claude/skills/`, `.claude/agents/` klasörlerinde.

**İlk kez kullanıyorsan:**
1. `.claude/rules/conventions.md` - Kod standartları
2. `.claude/rules/styling.md` - Tailwind kuralları
3. `.claude/skills/order-workflow.md` - Sipariş nasıl işlenir

---

## Kurumsal Bilgiler

- **Ünvan:** Sade Unlu Mamülleri San ve Tic Ltd Şti
- **Adres:** Yeşilbahçe mah. Çınarlı cd 47/A Muratpaşa Antalya
- **Vergi:** Antalya Kurumlar VD / 7361500827
