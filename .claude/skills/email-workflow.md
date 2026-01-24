---
name: email-workflow
description: SendGrid ile email gönderme iş akışı
---

# Email Gönderme Workflow

## Ne Zaman Kullan

- Sipariş onay email'i
- Kargo bilgilendirme email'i
- Sipariş iptal email'i
- Ödeme hatırlatma email'i
- İletişim formu yanıtları

## SendGrid Firebase Extension

Sade Chocolate projesi **SendGrid Firebase Extension** kullanır.
Email gönderimi için `mail` koleksiyonuna doküman eklenir.

### Nasıl Çalışır?

```
1. Firebase Extension aktif
2. Code: mail koleksiyonuna doküman ekle
3. Extension: SendGrid API üzerinden email gönder
4. Extension: Doküman'a delivery durumu yaz
```

## Email Gönderme Temel Pattern

```typescript
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const sendEmail = async (emailData: EmailData) => {
  try {
    const mailRef = collection(db, 'mail')
    await addDoc(mailRef, {
      to: emailData.to,
      from: 'noreply@sadechocolate.com', // Varsayılan gönderici
      subject: emailData.subject,
      html: emailData.html,
      // veya template kullan
      template: {
        name: emailData.templateName,
        data: emailData.templateData
      }
    })

    console.log('Email kuyruğa eklendi:', emailData.to)
  } catch (error) {
    // Email hatası siparişi etkilemez
    console.error('Email gönderilemedi:', error)
    // Kullanıcıya hata gösterme!
  }
}
```

## Email Türleri ve Template'leri

### 1. Sipariş Onay Email'i

**Ne zaman:** Ödeme başarılı olduktan sonra (status: paid)

```typescript
const sendOrderConfirmationEmail = async (order: Order) => {
  try {
    const mailRef = collection(db, 'mail')
    await addDoc(mailRef, {
      to: order.customerEmail,
      template: {
        name: 'order-confirmation',
        data: {
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          orderDate: formatDate(order.createdAt),
          items: order.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: formatPrice(item.price)
          })),
          subtotal: formatPrice(order.subtotal),
          shippingCost: formatPrice(order.shippingCost || 0),
          total: formatPrice(order.total),
          shippingAddress: formatAddress(order.shippingAddress),
          paymentMethod: order.paymentMethod === 'iyzico' ? 'Kredi Kartı' : 'Havale/EFT'
        }
      }
    })

    console.log('Sipariş onay email\'i gönderildi:', order.orderNumber)
  } catch (error) {
    console.error('Sipariş onay email\'i gönderilemedi:', error)
    // Sipariş devam eder, email hatası önemsiz
  }
}
```

### 2. Kargo Bilgilendirme Email'i

**Ne zaman:** Kargo oluşturulduğunda (status: shipped)

```typescript
const sendShippingNotificationEmail = async (order: Order) => {
  try {
    const mailRef = collection(db, 'mail')
    await addDoc(mailRef, {
      to: order.customerEmail,
      template: {
        name: 'shipping-notification',
        data: {
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber,
          shippingProvider: order.shippingProvider === 'geliver' ? 'Geliver' : 'MNG Kargo',
          trackingUrl: getTrackingUrl(order.trackingNumber, order.shippingProvider),
          estimatedDelivery: '2-3 iş günü'
        }
      }
    })

    console.log('Kargo bilgilendirme email\'i gönderildi:', order.orderNumber)
  } catch (error) {
    console.error('Kargo bilgilendirme email\'i gönderilemedi:', error)
  }
}
```

### 3. Sipariş İptal Email'i

**Ne zaman:** Sipariş iptal edildiğinde (status: cancelled)

```typescript
const sendCancellationEmail = async (order: Order) => {
  try {
    const mailRef = collection(db, 'mail')
    await addDoc(mailRef, {
      to: order.customerEmail,
      template: {
        name: 'order-cancellation',
        data: {
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          cancellationReason: order.cancellationReason || 'Belirtilmedi',
          refundInfo: order.paymentMethod === 'iyzico'
            ? 'İade tutarı 5-7 iş günü içinde kartınıza yansıyacaktır.'
            : 'İade işlemi için müşteri hizmetlerimiz sizinle iletişime geçecektir.'
        }
      }
    })

    console.log('İptal email\'i gönderildi:', order.orderNumber)
  } catch (error) {
    console.error('İptal email\'i gönderilemedi:', error)
  }
}
```

### 4. İletişim Formu Yanıtı

**Ne zaman:** İletişim formu doldurulduğunda

```typescript
const sendContactFormEmail = async (formData: ContactFormData) => {
  try {
    const mailRef = collection(db, 'mail')

    // 1. Müşteriye otomatik yanıt
    await addDoc(mailRef, {
      to: formData.email,
      template: {
        name: 'contact-auto-reply',
        data: {
          name: formData.name,
          message: formData.message
        }
      }
    })

    // 2. Admin'e bildirim
    await addDoc(mailRef, {
      to: 'info@sadechocolate.com',
      subject: `Yeni İletişim Formu: ${formData.subject}`,
      html: `
        <h2>Yeni İletişim Formu</h2>
        <p><strong>Ad:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Konu:</strong> ${formData.subject}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${formData.message}</p>
      `
    })

    console.log('İletişim formu email\'leri gönderildi')
  } catch (error) {
    console.error('İletişim formu email\'leri gönderilemedi:', error)
  }
}
```

## Email Template'leri

### Template Yapısı

SendGrid'de önceden tanımlı template'ler:
- `order-confirmation` - Sipariş onay
- `shipping-notification` - Kargo bilgilendirme
- `order-cancellation` - Sipariş iptal
- `contact-auto-reply` - İletişim formu otomatik yanıt

### Template Data

Her template kendine özgü data bekler:

```typescript
type OrderConfirmationData = {
  customerName: string
  orderNumber: string
  orderDate: string
  items: Array<{
    name: string
    quantity: number
    price: string
  }>
  subtotal: string
  shippingCost: string
  total: string
  shippingAddress: string
  paymentMethod: string
}

type ShippingNotificationData = {
  customerName: string
  orderNumber: string
  trackingNumber: string
  shippingProvider: string
  trackingUrl: string
  estimatedDelivery: string
}
```

## Helper Functions

### Formatters

```typescript
// Tarih formatla
const formatDate = (timestamp: Timestamp): string => {
  const date = timestamp.toDate()
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Fiyat formatla
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(price)
}

// Adres formatla
const formatAddress = (address: Address): string => {
  return `${address.address}, ${address.district}, ${address.city} ${address.postalCode || ''}`
}

// Tracking URL oluştur
const getTrackingUrl = (trackingNumber: string, provider: string): string => {
  if (provider === 'geliver') {
    return `https://geliver.com/tracking/${trackingNumber}`
  } else if (provider === 'mng') {
    return `https://mngkargo.com.tr/track?barcode=${trackingNumber}`
  }
  return '#'
}
```

## Error Handling

### Email Hataları Sessizce Logla

**ÖNEMLİ:** Email hatası sipariş işlemini ETKİLEMEZ!

```typescript
// ✅ DOĞRU - Email hatası kullanıcıya gösterilmez
try {
  await sendOrderConfirmationEmail(order)
} catch (error) {
  console.error('Email gönderilemedi:', error)
  // Kullanıcıya hata gösterme!
  // Sipariş başarılı mesajı göster
}

// ❌ YANLIŞ - Email hatası kullanıcıya gösterilir
try {
  await sendOrderConfirmationEmail(order)
} catch (error) {
  toast.error('Email gönderilemedi') // YAPMA!
  // Bu kullanıcıyı gereksiz endişelendirir
}
```

### Email Delivery Status Kontrolü

```typescript
// Email gönderim durumunu kontrol et (opsiyonel)
const checkEmailStatus = async (emailDocId: string) => {
  const emailRef = doc(db, 'mail', emailDocId)
  const emailSnap = await getDoc(emailRef)

  if (emailSnap.exists()) {
    const data = emailSnap.data()
    console.log('Email status:', {
      delivery: data.delivery, // success, error, pending
      error: data.delivery?.error
    })
  }
}
```

## Best Practices

1. **Email hatası sessiz olsun** - Console'a log, kullanıcıya gösterme
2. **Template kullan** - HTML yerine SendGrid template'i tercih et
3. **Data validate et** - Template data'sını kontrol et
4. **Formatters kullan** - Tarih, fiyat, adres için
5. **Tracking link ekle** - Kargo email'lerinde
6. **Otomatik yanıt** - İletişim formu için
7. **Admin bildirim** - Önemli formlar için
8. **Async gönder** - UI'ı bloke etme

## Email Test Etme

### Test Email Gönderme

```typescript
// Development'da test email gönder
const sendTestEmail = async () => {
  if (import.meta.env.DEV) {
    const mailRef = collection(db, 'mail')
    await addDoc(mailRef, {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Bu bir test email\'idir</p>'
    })
    console.log('Test email gönderildi')
  }
}
```

### SendGrid Dashboard

1. SendGrid Dashboard'a git
2. Activity → Email Activity
3. Gönderilen email'leri kontrol et
4. Delivery status'ü gör

## Yaygın Hatalar ve Çözümleri

### 1. Email Gönderilmedi

```
Sebep: SendGrid API key hatalı veya limiti aşıldı
Çözüm: Firebase Console → Extensions → SendGrid → Configuration kontrol et
```

### 2. Template Bulunamadı

```
Sebep: SendGrid'de template oluşturulmamış
Çözüm: SendGrid Dashboard → Templates → Create Template
```

### 3. Email Spam'e Düşüyor

```
Sebep: SPF/DKIM ayarları eksik
Çözüm: Domain DNS ayarlarını yapılandır
```

## İlgili Dosyalar

- `src/services/emailService.ts` - Email servisleri
- `functions/src/email/templates.ts` - Template data tipleri
- `.env` - SendGrid API key (functions klasöründe)
