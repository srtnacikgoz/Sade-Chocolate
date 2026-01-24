# Firebase Kuralları ve Best Practices

## Firestore Koleksiyonları

### Ana Koleksiyonlar

| Koleksiyon | Açıklama | Örnek Doküman ID |
|------------|----------|------------------|
| `products` | Ürün bilgileri | Auto-generated |
| `orders` | Siparişler | Auto-generated |
| `customers` | Müşteri bilgileri | Auto-generated |
| `site_settings/*` | Site genel ayarları | Specific keys |
| `settings/*` | Uygulama ayarları | Specific keys |
| `mail` | Email kuyruğu (SendGrid) | Auto-generated |

### Koleksiyon Yapısı Örnekleri

```typescript
// products koleksiyonu
type Product = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  category: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// orders koleksiyonu
type Order = {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'iyzico' | 'bank_transfer'
  shippingAddress: Address
  trackingNumber: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// customers koleksiyonu
type Customer = {
  id: string
  name: string
  email: string
  phone: string
  addresses: Address[]
  orders: string[] // order IDs
  createdAt: Timestamp
  lastOrderAt: Timestamp | null
}
```

## CRUD İşlemleri

### Create (Ekleme)

```typescript
// ✅ DOĞRU
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const ordersRef = collection(db, 'orders')
const newOrder = await addDoc(ordersRef, {
  orderNumber: generateOrderNumber(),
  customerId: customer.id,
  items: cartItems,
  total: calculateTotal(cartItems),
  status: 'pending',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
})

// ❌ YANLIŞ - Timestamp manuel oluşturma
createdAt: new Date() // Sunucu saati kullan!
```

### Read (Okuma)

```typescript
// ✅ DOĞRU - Tek doküman
import { doc, getDoc } from 'firebase/firestore'

const orderRef = doc(db, 'orders', orderId)
const orderSnap = await getDoc(orderRef)

if (orderSnap.exists()) {
  const order = { id: orderSnap.id, ...orderSnap.data() } as Order
} else {
  console.log('Sipariş bulunamadı')
}

// ✅ DOĞRU - Koleksiyon sorgulama
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'

const ordersRef = collection(db, 'orders')
const q = query(
  ordersRef,
  where('customerId', '==', customerId),
  orderBy('createdAt', 'desc')
)
const querySnapshot = await getDocs(q)
const orders = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
})) as Order[]
```

### Update (Güncelleme)

```typescript
// ✅ DOĞRU
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

const orderRef = doc(db, 'orders', orderId)
await updateDoc(orderRef, {
  status: 'shipped',
  trackingNumber: 'MNG123456789',
  updatedAt: serverTimestamp()
})

// ✅ DOĞRU - Nested field güncelleme
await updateDoc(orderRef, {
  'shippingAddress.city': 'İstanbul',
  updatedAt: serverTimestamp()
})
```

### Delete (Silme)

```typescript
// ✅ DOĞRU - Silme işlemi + local state güncelleme
import { doc, deleteDoc } from 'firebase/firestore'

const handleDeleteOrder = async (orderId: string) => {
  try {
    // 1. Firestore'dan sil
    const orderRef = doc(db, 'orders', orderId)
    await deleteDoc(orderRef)

    // 2. Local state'i güncelle
    setOrders(orders.filter(o => o.id !== orderId))

    toast.success('Sipariş silindi')
  } catch (error) {
    console.error('Sipariş silinemedi:', error)
    toast.error('Bir hata oluştu')
  }
}

// ❌ YANLIŞ - Sadece Firestore'dan silme, local state güncellenmemiş
await deleteDoc(orderRef)
// setOrders çağrılmadı!
```

## Real-time Listeners

### onSnapshot Kullanımı

```typescript
// ✅ DOĞRU - Cleanup ile
import { collection, onSnapshot } from 'firebase/firestore'

useEffect(() => {
  const ordersRef = collection(db, 'orders')
  const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
    const ordersData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[]
    setOrders(ordersData)
  })

  // Cleanup
  return () => unsubscribe()
}, [])

// ❌ YANLIŞ - Cleanup yok, memory leak!
useEffect(() => {
  onSnapshot(ordersRef, (snapshot) => {
    setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  })
  // return yok!
}, [])
```

## Batch İşlemler

### Batch Write

```typescript
// ✅ DOĞRU - Birden fazla işlemi atomik olarak yap
import { writeBatch, doc } from 'firebase/firestore'

const batch = writeBatch(db)

// Birden fazla sipariş durumunu güncelle
orderIds.forEach(orderId => {
  const orderRef = doc(db, 'orders', orderId)
  batch.update(orderRef, {
    status: 'cancelled',
    updatedAt: serverTimestamp()
  })
})

// Tümünü bir seferde commit et
await batch.commit()
```

## Query Best Practices

### İndeksleme
- Compound query kullanıyorsan, Firebase Console'da index oluştur
- Error mesajında verilen link ile otomatik oluşturabilirsin

```typescript
// Bu sorgu index gerektirir
const q = query(
  ordersRef,
  where('customerId', '==', customerId),
  where('status', '==', 'shipped'),
  orderBy('createdAt', 'desc')
)
```

### Pagination

```typescript
// ✅ DOĞRU - Limit ve startAfter kullan
import { limit, startAfter } from 'firebase/firestore'

const firstPage = query(ordersRef, orderBy('createdAt', 'desc'), limit(20))
const firstSnapshot = await getDocs(firstPage)

// İkinci sayfa için son dokümanı kullan
const lastVisible = firstSnapshot.docs[firstSnapshot.docs.length - 1]
const nextPage = query(
  ordersRef,
  orderBy('createdAt', 'desc'),
  startAfter(lastVisible),
  limit(20)
)
```

## Güvenlik Kuralları

### Destructive İşlemler İçin Onay

**Bu işlemlerden önce kullanıcıdan onay al:**
1. Toplu silme işlemleri
2. Sipariş iptali
3. Ürün silme
4. Müşteri silme

```typescript
// ✅ DOĞRU - AlertDialog ile onay
const handleDeleteProduct = async (productId: string) => {
  const confirmed = await showConfirmDialog({
    title: 'Ürünü Sil',
    message: 'Bu ürün kalıcı olarak silinecek. Emin misiniz?',
    confirmText: 'Sil',
    cancelText: 'İptal'
  })

  if (confirmed) {
    await deleteDoc(doc(db, 'products', productId))
  }
}
```

## Error Handling

### Firestore Errors

```typescript
// ✅ DOĞRU - Specific error handling
import { FirebaseError } from 'firebase/app'

try {
  await updateDoc(orderRef, { status: 'shipped' })
} catch (error) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        toast.error('Yetkiniz yok')
        break
      case 'not-found':
        toast.error('Sipariş bulunamadı')
        break
      case 'unavailable':
        toast.error('Bağlantı hatası, tekrar deneyin')
        break
      default:
        console.error('Firestore error:', error)
        toast.error('Bir hata oluştu')
    }
  }
}
```

## Cloud Functions Çağırma

### Firebase Functions

```typescript
// ✅ DOĞRU
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

type CreateShipmentData = {
  orderId: string
  address: Address
}

type CreateShipmentResult = {
  success: boolean
  trackingNumber?: string
  error?: string
}

const createShipment = httpsCallable<CreateShipmentData, CreateShipmentResult>(
  functions,
  'createShipment'
)

try {
  const result = await createShipment({ orderId, address })

  if (result.data.success) {
    toast.success('Kargo oluşturuldu')
    return result.data.trackingNumber
  } else {
    toast.error(result.data.error || 'Kargo oluşturulamadı')
  }
} catch (error) {
  console.error('Cloud Function error:', error)
  toast.error('Bir hata oluştu')
}
```

## Best Practices Özet

1. **Her zaman `serverTimestamp()` kullan** - Client saati güvenilmez
2. **Silme işlemlerinde local state'i de güncelle** - UI tutarlılığı
3. **Real-time listener'larda cleanup yap** - Memory leak önleme
4. **Batch işlemleri atomik yap** - Veri tutarlılığı
5. **Compound query için index oluştur** - Performance
6. **Destructive işlemler için onay al** - Kullanıcı deneyimi
7. **Error handling yap** - Her async işlemde try-catch
8. **Type safety kullan** - TypeScript tipleri ile
