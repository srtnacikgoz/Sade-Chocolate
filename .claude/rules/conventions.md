# Kod Standartları ve Konvansiyonlar

## Dosya Organizasyonu

### Dosya Limitleri
- **Maximum:** 500 satır
- **İdeal:** 300-450 satır
- Bir dosya 500 satırı aşıyorsa refactor et

### Dosya Adlandırma
- React bileşenleri: `PascalCase.tsx` (örn: `OrderCard.tsx`)
- Utilities: `camelCase.ts` (örn: `emailUtils.ts`)
- Services: `camelCase.ts` (örn: `shippingService.ts`)
- Types: `camelCase.types.ts` (örn: `order.types.ts`)

## Dil ve Yorum Standartları

### Kullanıcı Arayüzü
- **Tüm UI metinleri Türkçe olmalı**
- Buton metinleri: "Kaydet", "Sil", "İptal"
- Form etiketleri: "Ad Soyad", "E-posta", "Telefon"
- Hata mesajları: "Bu alan zorunludur"

### Kod Yorumları
- **Tüm yorumlar Türkçe olmalı**
- Karmaşık mantık için açıklayıcı yorumlar ekle
- TODO yorumları: `// TODO: Sipariş durumu kontrolü eklenecek`

```typescript
// İYİ ÖRNEK
// Sipariş durumu "shipped" ise kargo takip numarası göster
if (order.status === 'shipped' && order.trackingNumber) {
  return <TrackingInfo number={order.trackingNumber} />
}
```

## Import Organizasyonu

### Sıralama
1. React ve üçüncü parti kütüphaneler
2. Yerel bileşenler
3. Utility ve servisler
4. Tipler
5. Stiller

```typescript
// İYİ ÖRNEK
import { useState } from 'react'
import { Button } from '@/components/ui/button'

import { OrderCard } from '@/components/admin/OrderCard'
import { formatPrice } from '@/utils/formatters'
import { orderService } from '@/services/orderService'

import type { Order } from '@/types/order.types'
```

## Naming Konvansiyonları

### Değişkenler
- **Booleans:** `is`, `has`, `should` prefix kullan
  - `isLoading`, `hasError`, `shouldShowModal`
- **Arrays:** Çoğul isim kullan
  - `orders`, `products`, `customers`
- **Handlers:** `handle` prefix kullan
  - `handleSubmit`, `handleDelete`, `handleClose`

### Fonksiyonlar
- Açıklayıcı fiil + isim
  - `fetchOrders`, `createShipment`, `sendEmail`
- Async fonksiyonlar açıkça belirt
  - `async function fetchOrders()`

### React Bileşenleri
- PascalCase
- Açıklayıcı ve spesifik isimler
  - `OrderCard`, `ShipmentTracker`, `PaymentForm`
  - ❌ `Card`, `Tracker`, `Form` (çok genel)

## State Management

### useState
- Anlamlı başlangıç değerleri kullan
- State değişkenlerini grupla

```typescript
// İYİ ÖRNEK
const [order, setOrder] = useState<Order | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### useEffect
- Dependency array'i her zaman doğru kullan
- Cleanup fonksiyonları ekle (gerekirse)

## Error Handling

### Try-Catch Blokları
- Tüm async işlemlerde kullan
- Kullanıcıya anlamlı hata mesajı göster
- Console'a detaylı log at

```typescript
// İYİ ÖRNEK
try {
  await orderService.updateStatus(orderId, 'shipped')
  toast.success('Sipariş durumu güncellendi')
} catch (error) {
  console.error('Sipariş durumu güncellenemedi:', error)
  toast.error('Bir hata oluştu')
}
```

## TypeScript Kullanımı

### Tip Tanımlamaları
- `any` kullanma, `unknown` veya spesifik tip kullan
- Interface yerine `type` tercih et (consistency için)
- Nullable değerler için `| null` ekle

```typescript
// İYİ ÖRNEK
type Order = {
  id: string
  customerName: string
  total: number
  status: OrderStatus
  trackingNumber: string | null
}
```

## Component Structure

### Organizasyon Sırası
1. Imports
2. Types
3. Component definition
4. Hooks
5. Event handlers
6. Helper functions
7. Return/JSX

```typescript
// İYİ ÖRNEK
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type OrderCardProps = {
  order: Order
  onUpdate: (id: string) => void
}

export function OrderCard({ order, onUpdate }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```
