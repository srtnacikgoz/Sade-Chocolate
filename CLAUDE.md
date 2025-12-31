# Sade Chocolate - Claude Code Kılavuzu

## Proje Hakkında
Sade Chocolate e-ticaret platformu. React + TypeScript + Firebase + Tailwind CSS.

---

## Özel Dökümanlar

### Araştırma Framework'leri

| Dosya | Tetikleyiciler | Kullanım |
|-------|----------------|----------|
| `docs/deep-research.md` | "deep research", "derinlemesine araştırma", "araştırma yap" | Yeni bir konuyu araştırırken bu framework'teki soruları kullan |
| `docs/research-findings.md` | "araştırma kaydet", "bulguları kaydet", "research findings" | Araştırma tamamlandığında bulguları bu template'e göre kaydet |

**Workflow:**
1. Kullanıcı "X konusunda deep research yap" dediğinde → `deep-research.md` framework'ünü kullan
2. Araştırma bitince "bulguları kaydet" dediğinde → `research-findings.md` template'ini doldur

---

## Tailwind Renk Paleti

Projede tanımlı renkler (geçersiz renk kullanma):
- `cream-*` (50-900)
- `mocha-*` (50-900)
- `gold-*` (50-900)
- `brown-*` (50-900)
- `dark-*` (50-900)
- `brand-*`

**UYARI:** `chocolate-*` renkleri tanımlı DEĞİL, kullanma!

---

## Firebase Collections

- `products` - Ürünler
- `orders` - Siparişler
- `customers` - Müşteriler
- `taste_profiles` - Tadım profilleri
- `quiz_config` - Quiz yapılandırması
- `scenarios` - AI Sommelier senaryoları
- `loyalty_program` - Sadakat programı

---

## Önemli Notlar

- Türkçe UI, Türkçe yorumlar
- Admin paneli: `/admin` route
- AI Sommelier: Senaryo bazlı akıllı asistan
- Tadım Quiz: Firestore'dan dinamik sorular (`quiz_config/default`)
