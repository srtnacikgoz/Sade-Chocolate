# Styling ve Tasarım Kuralları

## Tailwind CSS Kullanımı

### Renk Paleti

**Kullanılabilir Renkler:**
- `cream-*` - Krem tonları
- `mocha-*` - Kahverengi tonları
- `gold-*` - Altın tonları
- `brown-*` - Kahverengi tonları
- `dark-*` - Koyu tonlar
- `brand-*` - Marka renkleri

**Brand Renkleri:**
| Sınıf | Hex | Kullanım |
|-------|-----|----------|
| `brand-blue` | #a4d1e8 | Bilgi mesajları, linkler |
| `brand-yellow` | #e7c57d | Vurgular |
| `brand-mustard` | #d4a945 | CTA butonları |
| `brand-green` | #a4d4bc | Başarı mesajları |
| `brand-peach` | #f3d1c8 | Yumuşak vurgular |
| `brand-orange` | #e59a77 | Uyarılar |

**⚠️ UYARI:** `chocolate-*` renkleri tanımlı DEĞİL! Kullanma!

```tsx
// ✅ DOĞRU
<div className="bg-mocha-100 text-brown-800">

// ❌ YANLIŞ
<div className="bg-chocolate-100 text-chocolate-800">
```

## Z-Index Hiyerarşisi

**Sabit değerler kullan, rastgele z-index verme!**

| Katman | Z-Index | Kullanım |
|--------|---------|----------|
| **Sticky** | `100` | Sticky header/navigation |
| **Overlay** | `500` | Backdrop, overlay |
| **Modal** | `1000` | Modal dialoglar |
| **Popover** | `1500` | Dropdown, tooltip, popover |
| **Toast** | `2000` | Toast bildirimler |

```tsx
// ✅ DOĞRU
<div className="sticky top-0 z-[100]">Header</div>
<div className="z-[500]">Overlay</div>
<div className="z-[1000]">Modal</div>
<div className="z-[1500]">Dropdown</div>
<div className="z-[2000]">Toast</div>

// ❌ YANLIŞ
<div className="z-50">Modal</div>
<div className="z-999">Dropdown</div>
```

## Border Radius (Köşe Yuvarlaklığı)

**Tutarlılık için sabit değerler kullan:**

| Element Tipi | Radius | Class |
|--------------|--------|-------|
| **Ana elementler** | 32px | `rounded-[32px]` |
| **Kartlar** | 24px | `rounded-2xl` |
| **Butonlar** | 16px | `rounded-xl` |
| **Input** | 12px | `rounded-lg` |
| **Küçük elementler** | 8px | `rounded-md` |

```tsx
// ✅ DOĞRU
<div className="rounded-[32px]">Ana Container</div>
<div className="rounded-2xl">Kart</div>
<button className="rounded-xl">Buton</button>
<input className="rounded-lg" />

// ❌ YANLIŞ
<div className="rounded-3xl">Ana Container</div> // 32px değil
<button className="rounded-2xl">Buton</button> // Çok büyük
```

## Spacing ve Layout

### Tutarlı Spacing
- Küçük: `gap-2`, `p-2`, `m-2` (8px)
- Orta: `gap-4`, `p-4`, `m-4` (16px)
- Büyük: `gap-6`, `p-6`, `m-6` (24px)
- Çok Büyük: `gap-8`, `p-8`, `m-8` (32px)

### Container Genişlikleri
```tsx
// İçerik container'ları
<div className="max-w-7xl mx-auto px-4">
  {/* Ana içerik */}
</div>

// Form container'ları
<div className="max-w-md mx-auto">
  {/* Form */}
</div>

// Admin panel
<div className="max-w-screen-2xl mx-auto">
  {/* Admin içerik */}
</div>
```

## Typography

### Font Boyutları
```tsx
// Başlıklar
<h1 className="text-4xl font-bold">Ana Başlık</h1>
<h2 className="text-3xl font-semibold">Alt Başlık</h2>
<h3 className="text-2xl font-semibold">Bölüm Başlığı</h3>

// Metin
<p className="text-base">Normal metin</p>
<p className="text-sm text-gray-600">Yardımcı metin</p>
<p className="text-xs text-gray-500">Küçük metin</p>
```

## Component Styling Patterns

### Buton Stilleri
```tsx
// Primary
<button className="bg-brand-mustard hover:bg-brand-mustard/90 text-white rounded-xl px-6 py-3">
  Kaydet
</button>

// Secondary
<button className="bg-cream-100 hover:bg-cream-200 text-brown-800 rounded-xl px-6 py-3">
  İptal
</button>

// Danger
<button className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 py-3">
  Sil
</button>
```

### Kart Stilleri
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-6">
  {/* İçerik */}
</div>
```

### Input Stilleri
```tsx
<input
  className="w-full rounded-lg border border-cream-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
  type="text"
/>
```

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

```tsx
// Mobile-first yaklaşım
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

## İkonlar

### BrandIcon Kullan
**Sparkles yerine BrandIcon kullan!**

```tsx
// ✅ DOĞRU
import { BrandIcon } from '@/components/BrandIcon'

<BrandIcon name="shopping-cart" />

// ❌ YANLIŞ
import { Sparkles } from 'lucide-react'

<Sparkles />
```

## Animasyonlar

### Hover Efektleri
```tsx
// Smooth transitions
<button className="transition-all duration-200 hover:scale-105">
  Butona Tıkla
</button>

// Opacity değişimi
<div className="transition-opacity duration-300 hover:opacity-80">
  Kart
</div>
```

### Loading States
```tsx
// Skeleton loading
<div className="animate-pulse bg-cream-200 h-4 rounded" />

// Spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-mustard" />
```

## Dark Mode

**Şu anda dark mode desteklenmiyor.**
Gelecekte eklenirse, `dark:` prefix ile stil ekle.

## Best Practices

1. **Tailwind sınıflarını alfabetik sırala** (Prettier ile)
2. **Özel CSS yazmaktan kaçın**, Tailwind kullan
3. **Inline style kullanma**, Tailwind sınıfları kullan
4. **Renk kodu kullanma** (`#fff`), Tailwind renkleri kullan
5. **Pixel değerleri kullanma** (`w-[150px]`), Tailwind spacing kullan (istisnalar hariç)

```tsx
// ✅ DOĞRU
<div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">

// ❌ YANLIŞ
<div style={{ display: 'flex', gap: '16px', background: '#fff' }}>
```
