---
name: shipping-workflow
description: Kargo entegrasyonu ve takip iş akışı (MNG/Geliver)
---

# Kargo Workflow

## Ne Zaman Kullan

- Kargo gönderi oluşturma
- Kargo takip numarası alma
- Kargo durumu sorgulama
- Kargo firması değiştirme
- Kargo hatalarını ele alma

## Desteklenen Kargo Firmaları

| Firma | API Status | Kullanım |
|-------|-----------|----------|
| **Geliver** | ✅ Aktif | Birincil kargo firması |
| **MNG Kargo** | ✅ Aktif | Yedek firma |

## Kargo Oluşturma İş Akışı

### 1. Sipariş Hazır Kontrolü

```typescript
// Kargo göndermeden önce kontrol et
const isReadyForShipping = (order: Order): boolean => {
  return (
    order.status === 'paid' && // Ödeme alınmış
    order.shippingAddress !== null && // Adres mevcut
    !order.trackingNumber // Daha önce kargo oluşturulmamış
  )
}
```

### 2. Kargo Servisi Seçimi

```typescript
// Geliver öncelikli, hata durumunda MNG'ye fallback
const createShipment = async (order: Order) => {
  try {
    // 1. Önce Geliver'i dene
    const result = await createGeliverShipment(order)
    return result
  } catch (error) {
    console.error('Geliver hatası, MNG\'ye geçiliyor:', error)

    try {
      // 2. Geliver başarısızsa MNG'yi dene
      const result = await createMNGShipment(order)
      return result
    } catch (mngError) {
      console.error('MNG hatası:', mngError)
      throw new Error('Kargo oluşturulamadı')
    }
  }
}
```

### 3. Geliver Entegrasyonu

```typescript
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

type CreateGeliverShipmentData = {
  orderId: string
  receiver: {
    name: string
    phone: string
    address: string
    city: string
    district: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

type CreateGeliverShipmentResult = {
  success: boolean
  trackingNumber?: string
  error?: string
  provider: 'geliver'
}

const createGeliverShipment = async (order: Order) => {
  const createShipment = httpsCallable<
    CreateGeliverShipmentData,
    CreateGeliverShipmentResult
  >(functions, 'createGeliverShipment')

  const result = await createShipment({
    orderId: order.id,
    receiver: {
      name: order.customerName,
      phone: order.customerPhone,
      address: order.shippingAddress.address,
      city: order.shippingAddress.city,
      district: order.shippingAddress.district
    },
    items: order.items.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.price
    }))
  })

  if (!result.data.success) {
    throw new Error(result.data.error || 'Geliver gönderi oluşturulamadı')
  }

  return result.data
}
```

### 4. MNG Kargo Entegrasyonu (Fallback)

```typescript
type CreateMNGShipmentData = {
  orderId: string
  receiver: {
    name: string
    phone: string
    address: string
    city: string
    district: string
  }
}

type CreateMNGShipmentResult = {
  success: boolean
  trackingNumber?: string
  error?: string
  provider: 'mng'
}

const createMNGShipment = async (order: Order) => {
  const createShipment = httpsCallable<
    CreateMNGShipmentData,
    CreateMNGShipmentResult
  >(functions, 'createMNGShipment')

  const result = await createShipment({
    orderId: order.id,
    receiver: {
      name: order.customerName,
      phone: order.customerPhone,
      address: order.shippingAddress.address,
      city: order.shippingAddress.city,
      district: order.shippingAddress.district
    }
  })

  if (!result.data.success) {
    throw new Error(result.data.error || 'MNG gönderi oluşturulamadı')
  }

  return result.data
}
```

### 5. Sipariş Güncelleme

```typescript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

const updateOrderWithTracking = async (
  orderId: string,
  trackingNumber: string,
  provider: 'geliver' | 'mng'
) => {
  const orderRef = doc(db, 'orders', orderId)

  await updateDoc(orderRef, {
    status: 'shipped',
    trackingNumber,
    shippingProvider: provider,
    shippedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}
```

### 6. Tam İş Akışı

```typescript
const handleCreateShipment = async (order: Order) => {
  try {
    // 1. Kontrol
    if (!isReadyForShipping(order)) {
      toast.error('Sipariş kargo için hazır değil')
      return
    }

    setIsLoading(true)

    // 2. Kargo oluştur (Geliver → MNG fallback)
    const result = await createShipment(order)

    // 3. Siparişi güncelle
    await updateOrderWithTracking(
      order.id,
      result.trackingNumber!,
      result.provider
    )

    // 4. Email gönder
    await sendShippingNotificationEmail({
      ...order,
      trackingNumber: result.trackingNumber,
      shippingProvider: result.provider
    })

    toast.success('Kargo oluşturuldu')
  } catch (error) {
    console.error('Kargo oluşturma hatası:', error)
    toast.error('Kargo oluşturulamadı')
  } finally {
    setIsLoading(false)
  }
}
```

## Kargo Takip

### 1. Takip Numarası ile Sorgulama

```typescript
type TrackShipmentResult = {
  success: boolean
  status?: string
  statusDescription?: string
  lastUpdate?: string
  history?: Array<{
    date: string
    status: string
    description: string
    location?: string
  }>
  error?: string
}

const trackShipment = async (
  trackingNumber: string,
  provider: 'geliver' | 'mng'
) => {
  const track = httpsCallable<
    { trackingNumber: string; provider: string },
    TrackShipmentResult
  >(functions, 'trackShipment')

  const result = await track({ trackingNumber, provider })

  if (!result.data.success) {
    throw new Error(result.data.error || 'Kargo takip edilemedi')
  }

  return result.data
}
```

### 2. Takip Bileşeni

```typescript
// src/components/account/ShipmentTracker.tsx

const ShipmentTracker = ({ trackingNumber, provider }: Props) => {
  const [trackingInfo, setTrackingInfo] = useState<TrackShipmentResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTrack = async () => {
    try {
      setIsLoading(true)
      const info = await trackShipment(trackingNumber, provider)
      setTrackingInfo(info)
    } catch (error) {
      console.error('Takip hatası:', error)
      toast.error('Kargo takip edilemedi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6">
      <h3 className="text-xl font-semibold">Kargo Takip</h3>
      <p className="text-sm text-gray-600">
        Takip No: {trackingNumber}
      </p>

      <button
        onClick={handleTrack}
        disabled={isLoading}
        className="mt-4 rounded-xl bg-brand-mustard px-4 py-2 text-white"
      >
        {isLoading ? 'Sorgulanıyor...' : 'Kargo Durumunu Sorgula'}
      </button>

      {trackingInfo && (
        <div className="mt-4">
          <p className="font-semibold">{trackingInfo.statusDescription}</p>
          <p className="text-sm text-gray-600">{trackingInfo.lastUpdate}</p>

          {trackingInfo.history && (
            <div className="mt-4 space-y-2">
              {trackingInfo.history.map((item, index) => (
                <div key={index} className="border-l-2 border-brand-blue pl-4">
                  <p className="text-sm font-semibold">{item.description}</p>
                  <p className="text-xs text-gray-600">{item.date}</p>
                  {item.location && (
                    <p className="text-xs text-gray-500">{item.location}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

## Error Handling

### Kargo API Hataları

```typescript
const handleShippingError = (error: unknown) => {
  if (error instanceof Error) {
    // API hata mesajlarını logla, kullanıcıya genel mesaj göster
    console.error('Kargo API hatası:', error.message)

    if (error.message.includes('address')) {
      toast.error('Adres bilgisi hatalı')
    } else if (error.message.includes('phone')) {
      toast.error('Telefon numarası hatalı')
    } else if (error.message.includes('timeout')) {
      toast.error('Bağlantı zaman aşımı, tekrar deneyin')
    } else {
      toast.error('Kargo oluşturulamadı')
    }
  }
}
```

## Admin Panel - Toplu Kargo Oluşturma

```typescript
const createMultipleShipments = async (orders: Order[]) => {
  const results = {
    success: [] as string[],
    failed: [] as string[]
  }

  for (const order of orders) {
    try {
      const result = await createShipment(order)
      await updateOrderWithTracking(
        order.id,
        result.trackingNumber!,
        result.provider
      )
      results.success.push(order.orderNumber)
    } catch (error) {
      console.error(`Sipariş ${order.orderNumber} başarısız:`, error)
      results.failed.push(order.orderNumber)
    }
  }

  // Sonuç raporu
  toast.success(`${results.success.length} kargo oluşturuldu`)
  if (results.failed.length > 0) {
    toast.error(`${results.failed.length} kargo başarısız`)
  }

  return results
}
```

## Best Practices

1. **Fallback stratejisi kullan** - Geliver → MNG
2. **Sipariş durumunu kontrol et** - Sadece "paid" siparişler
3. **Tracking number unique olsun** - Kargo firmasından al
4. **Email bildir** - Kargo oluşturulunca müşteriye haber ver
5. **Hataları logla** - Console.error ile detay kaydet
6. **Kullanıcıya genel mesaj** - API hatalarını açığa çıkarma
7. **Provider bilgisini sakla** - Takip için gerekli
8. **Timeout ayarla** - API çağrılarında zaman aşımı

## Cloud Functions

### createGeliverShipment

```typescript
// functions/src/index.ts
export const createGeliverShipment = functions.https.onCall(async (data, context) => {
  // 1. Auth kontrolü
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli')
  }

  // 2. Geliver API çağrısı
  const response = await axios.post(
    'https://api.geliver.com/v1/shipments',
    {
      // Geliver API payload
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.GELIVER_API_KEY}`
      }
    }
  )

  return {
    success: true,
    trackingNumber: response.data.trackingNumber,
    provider: 'geliver'
  }
})
```

## İlgili Dosyalar

- `functions/src/shipping/geliver.ts` - Geliver entegrasyonu
- `functions/src/shipping/mng.ts` - MNG entegrasyonu
- `src/services/shippingService.ts` - Frontend servis
- `src/components/admin/UnifiedOrderModal.tsx` - Kargo oluşturma UI
- `src/components/account/ShipmentTracker.tsx` - Takip UI
