---
name: order-workflow
description: Sipariş işleme ve yönetim iş akışı
---

# Sipariş İşleme Workflow

## Ne Zaman Kullan

- Yeni sipariş oluşturma
- Sipariş durumu güncelleme
- Sipariş iptali
- Sipariş detayları görüntüleme
- Sipariş listesi filtreleme

## Sipariş Yaşam Döngüsü

```
pending → paid → shipped → delivered
   ↓
cancelled
```

### Durum Açıklamaları

| Durum | Açıklama | Sonraki Durum |
|-------|----------|---------------|
| `pending` | Sipariş oluşturuldu, ödeme bekleniyor | `paid` veya `cancelled` |
| `paid` | Ödeme alındı, hazırlanıyor | `shipped` |
| `shipped` | Kargoya verildi | `delivered` |
| `delivered` | Teslim edildi | - |
| `cancelled` | İptal edildi | - |

## Sipariş Oluşturma Adımları

### 1. Validasyon

```typescript
import { z } from 'zod'

const orderValidationSchema = z.object({
  customerName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  customerEmail: z.string().email('Geçerli email girin'),
  customerPhone: z.string().regex(/^[0-9]{10}$/, 'Geçerli telefon girin'),
  shippingAddress: z.object({
    address: z.string().min(10),
    city: z.string().min(2),
    district: z.string().min(2),
    postalCode: z.string().optional()
  }),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0)
  })).min(1, 'En az bir ürün ekleyin')
})
```

### 2. Sipariş Numarası Oluşturma

```typescript
// Format: SD-YYYYMMDD-XXXX
// Örnek: SD-20260119-0001

const generateOrderNumber = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

  return `SD-${year}${month}${day}-${random}`
}
```

### 3. Firestore'a Kaydetme

```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const createOrder = async (orderData: OrderInput) => {
  try {
    // Validasyon
    const validated = orderValidationSchema.parse(orderData)

    // Sipariş numarası oluştur
    const orderNumber = generateOrderNumber()

    // Firestore'a kaydet
    const ordersRef = collection(db, 'orders')
    const orderDoc = await addDoc(ordersRef, {
      orderNumber,
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      customerPhone: validated.customerPhone,
      shippingAddress: validated.shippingAddress,
      items: validated.items,
      total: calculateTotal(validated.items),
      status: 'pending',
      paymentMethod: null,
      trackingNumber: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return { id: orderDoc.id, orderNumber }
  } catch (error) {
    console.error('Sipariş oluşturulamadı:', error)
    throw error
  }
}
```

### 4. Müşteriye Email Gönderme

```typescript
// Email sadece başarılı ödeme sonrası gönderilir
// Pending durumunda email gönderilmez

const sendOrderConfirmationEmail = async (order: Order) => {
  try {
    const mailRef = collection(db, 'mail')
    await addDoc(mailRef, {
      to: order.customerEmail,
      template: {
        name: 'order-confirmation',
        data: {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          shippingAddress: order.shippingAddress
        }
      }
    })

    console.log('Email kuyruğa eklendi:', order.customerEmail)
  } catch (error) {
    // Email hatası siparişi etkilemez
    console.error('Email gönderilemedi:', error)
    // Kullanıcıya hata gösterme!
  }
}
```

## Sipariş Durumu Güncelleme

### Pending → Paid

```typescript
const markOrderAsPaid = async (orderId: string, paymentMethod: string) => {
  const orderRef = doc(db, 'orders', orderId)

  await updateDoc(orderRef, {
    status: 'paid',
    paymentMethod,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  // Ödeme onaylandıktan sonra email gönder
  const orderSnap = await getDoc(orderRef)
  if (orderSnap.exists()) {
    const order = { id: orderSnap.id, ...orderSnap.data() } as Order
    await sendOrderConfirmationEmail(order)
  }
}
```

### Paid → Shipped

```typescript
const markOrderAsShipped = async (orderId: string, trackingNumber: string) => {
  const orderRef = doc(db, 'orders', orderId)

  await updateDoc(orderRef, {
    status: 'shipped',
    trackingNumber,
    shippedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  // Kargo bilgilendirme email'i gönder
  const orderSnap = await getDoc(orderRef)
  if (orderSnap.exists()) {
    const order = { id: orderSnap.id, ...orderSnap.data() } as Order
    await sendShippingNotificationEmail(order)
  }
}
```

### Sipariş İptali

```typescript
const cancelOrder = async (orderId: string, reason: string) => {
  // 1. Onay al
  const confirmed = await showConfirmDialog({
    title: 'Siparişi İptal Et',
    message: 'Bu sipariş iptal edilecek. Emin misiniz?',
    confirmText: 'İptal Et',
    cancelText: 'Vazgeç'
  })

  if (!confirmed) return

  // 2. Sipariş durumunu güncelle
  const orderRef = doc(db, 'orders', orderId)
  await updateDoc(orderRef, {
    status: 'cancelled',
    cancellationReason: reason,
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  // 3. İptal email'i gönder
  const orderSnap = await getDoc(orderRef)
  if (orderSnap.exists()) {
    const order = { id: orderSnap.id, ...orderSnap.data() } as Order
    await sendCancellationEmail(order)
  }

  // 4. Eğer ödeme alındıysa, iade işlemi başlat
  if (order.paymentMethod === 'iyzico') {
    // İyzico iade işlemi
    await initiateRefund(orderId)
  }
}
```

## Sipariş Listesi ve Filtreleme

### Admin Panel - Tüm Siparişler

```typescript
const fetchAllOrders = async (filters?: OrderFilters) => {
  const ordersRef = collection(db, 'orders')
  let q = query(ordersRef, orderBy('createdAt', 'desc'))

  // Durum filtresi
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status))
  }

  // Tarih aralığı filtresi
  if (filters?.startDate) {
    q = query(q, where('createdAt', '>=', filters.startDate))
  }
  if (filters?.endDate) {
    q = query(q, where('createdAt', '<=', filters.endDate))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[]
}
```

### Müşteri - Kendi Siparişleri

```typescript
const fetchCustomerOrders = async (customerId: string) => {
  const ordersRef = collection(db, 'orders')
  const q = query(
    ordersRef,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[]
}
```

## Error Handling

```typescript
const handleOrderError = (error: unknown) => {
  if (error instanceof z.ZodError) {
    toast.error(error.errors[0].message)
  } else if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        toast.error('Yetkiniz yok')
        break
      case 'not-found':
        toast.error('Sipariş bulunamadı')
        break
      default:
        console.error('Firebase error:', error)
        toast.error('Bir hata oluştu')
    }
  } else {
    console.error('Unknown error:', error)
    toast.error('Beklenmeyen bir hata oluştu')
  }
}
```

## Best Practices

1. **Her zaman validate et** - Zod ile sipariş verilerini doğrula
2. **Sipariş numarası unique olsun** - Timestamp + random kullan
3. **Email hatası siparişi etkilemesin** - Try-catch ile izole et
4. **Durum geçişlerini kontrol et** - Invalid geçişleri engelle
5. **Local state güncelle** - Firestore + UI sync
6. **Onay al** - İptal gibi kritik işlemler için
7. **Timestamp kullan** - serverTimestamp() ile
8. **Log tut** - Console.log ile önemli işlemleri kaydet

## İlgili Dosyalar

- `src/services/orderService.ts` - Sipariş servisleri
- `src/components/admin/OrderList.tsx` - Admin sipariş listesi
- `src/components/admin/OrderModal.tsx` - Sipariş detay modal
- `src/components/account/OrderHistory.tsx` - Müşteri sipariş geçmişi
- `src/types/order.types.ts` - Sipariş tipleri
