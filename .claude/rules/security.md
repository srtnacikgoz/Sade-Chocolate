# Güvenlik Kuralları

## Hassas Veri Yönetimi

### Asla Commit Etme

**Bu tür veriler asla Git'e commit edilmemelidir:**

1. **API Keys & Secrets**
   - İyzico API key/secret
   - Firebase admin SDK keys
   - SendGrid API keys
   - MNG Kargo API credentials
   - Geliver API credentials

2. **Environment Variables**
   - `.env` dosyaları
   - `.env.local`, `.env.production` dosyaları
   - `functions/.env.*` dosyaları

3. **Credentials**
   - Service account JSON dosyaları
   - Firebase config (production)
   - Database credentials

4. **Kişisel Veriler**
   - Müşteri email adresleri (testlerde)
   - Telefon numaraları
   - Adres bilgileri
   - Kredi kartı bilgileri (asla saklanmamalı)

### .gitignore Kontrolü

```bash
# ✅ DOĞRU - .gitignore'da olmalı
.env
.env.local
.env.production
functions/.env
functions/.env.*
serviceAccountKey.json
firebase-adminsdk-*.json
```

## Input Validation

### Tüm External Input Validate Et

```typescript
// ✅ DOĞRU - Form input validation
import { z } from 'zod'

const orderSchema = z.object({
  customerName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  customerEmail: z.string().email('Geçerli bir email girin'),
  customerPhone: z.string().regex(/^[0-9]{10}$/, 'Geçerli bir telefon numarası girin'),
  address: z.string().min(10, 'Adres en az 10 karakter olmalı')
})

const handleSubmit = (data: unknown) => {
  try {
    const validated = orderSchema.parse(data)
    // Güvenli, validated veriyi kullan
  } catch (error) {
    if (error instanceof z.ZodError) {
      toast.error(error.errors[0].message)
    }
  }
}

// ❌ YANLIŞ - Validation yok
const handleSubmit = (data: any) => {
  // Direkt data kullanılıyor, XSS riski!
  await createOrder(data)
}
```

### Sanitization

```typescript
// ✅ DOĞRU - HTML/Script injection önleme
import DOMPurify from 'dompurify'

const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // HTML tag'lere izin verme
    ALLOWED_ATTR: []
  })
}

const customerNote = sanitizeUserInput(formData.note)

// ❌ YANLIŞ - Sanitization yok
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // XSS riski!
```

## API Security

### Cloud Functions Güvenliği

```typescript
// ✅ DOĞRU - Auth kontrolü
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const createShipment = functions.https.onCall(async (data, context) => {
  // 1. Authentication kontrolü
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Kullanıcı girişi gerekli'
    )
  }

  // 2. Admin yetkisi kontrolü
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get()

  if (!userDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Bu işlem için yetkiniz yok'
    )
  }

  // 3. Input validation
  if (!data.orderId || !data.address) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Eksik parametre'
    )
  }

  // 4. İşlemi yap
  // ...
})

// ❌ YANLIŞ - Güvenlik kontrolü yok
export const createShipment = functions.https.onCall(async (data, context) => {
  // Direkt işlem yapılıyor, güvenlik riski!
  return await mngKargo.createShipment(data)
})
```

### Rate Limiting

```typescript
// ✅ DOĞRU - Rate limiting ekle
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Max 100 request
  message: 'Çok fazla istek gönderdiniz, lütfen bekleyin'
})

// Cloud Function'da kullan
app.use('/api/', limiter)
```

## Ödeme Güvenliği

### İyzico 3D Secure

```typescript
// ✅ DOĞRU - Her zaman 3D Secure kullan
const paymentRequest = {
  locale: 'tr',
  conversationId: orderId,
  price: total.toString(),
  paidPrice: total.toString(),
  currency: 'TRY',
  basketId: orderId,
  paymentGroup: 'PRODUCT',
  callbackUrl: `${process.env.SITE_URL}/payment/callback`,
  enabledInstallments: [1],
  // 3D Secure zorunlu
  paymentChannel: 'WEB',
  paymentGroup: 'PRODUCT'
}

// ❌ YANLIŞ - 3D Secure olmadan ödeme alma
// Güvenlik ve PCI-DSS uyumluluk riski!
```

### Kredi Kartı Bilgileri

**ASLA kredi kartı bilgilerini saklamayın!**

```typescript
// ✅ DOĞRU - İyzico'ya yönlendir, kart bilgisi saklanmaz
const paymentResult = await createIyzicoPayment(orderData)
window.location.href = paymentResult.paymentPageUrl

// ❌ YANLIŞ - Kart bilgilerini Firestore'a kaydetme
// Bu PCI-DSS ihlalidir ve yasalara aykırıdır!
await addDoc(collection(db, 'orders'), {
  cardNumber: formData.cardNumber, // ASLA YAPMA!
  cvv: formData.cvv, // ASLA YAPMA!
  // ...
})
```

## CORS ve Origin Kontrolü

### Cloud Functions CORS

```typescript
// ✅ DOĞRU - CORS yapılandırması
import cors from 'cors'

const corsHandler = cors({
  origin: [
    'https://sadechocolate.com',
    'https://www.sadechocolate.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : ''
  ].filter(Boolean),
  credentials: true
})

export const apiEndpoint = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, () => {
    // API logic
  })
})

// ❌ YANLIŞ - Herkese açık CORS
const corsHandler = cors({ origin: '*' }) // Güvenlik riski!
```

## Environment Variables

### Güvenli Kullanım

```typescript
// ✅ DOĞRU - Environment variable kontrolü
const IYZICO_API_KEY = process.env.VITE_IYZICO_API_KEY
const IYZICO_SECRET = process.env.VITE_IYZICO_SECRET

if (!IYZICO_API_KEY || !IYZICO_SECRET) {
  throw new Error('İyzico credentials eksik')
}

// ❌ YANLIŞ - Hardcoded credentials
const IYZICO_API_KEY = 'sandbox-abc123def456' // ASLA YAPMA!
```

### Frontend vs Backend

**Frontend'de:**
- ✅ Public key'ler (Firebase config public kısmı)
- ✅ API URLs
- ❌ Secret keys
- ❌ Admin credentials

**Backend'de (Cloud Functions):**
- ✅ Secret keys
- ✅ Admin credentials
- ✅ API secrets
- ✅ Database credentials

## SQL Injection Önleme

Firebase Firestore kullanıyorsunuz, SQL injection riski yok. Ancak:

```typescript
// ✅ DOĞRU - Firestore query (güvenli)
const q = query(
  collection(db, 'orders'),
  where('customerId', '==', userId) // Parameterized
)

// ❌ YANLIŞ - Eğer SQL kullanıyorsanız
// const query = `SELECT * FROM orders WHERE customerId = '${userId}'`
// SQL injection riski!
```

## Email Güvenliği

### Email Gönderimi

```typescript
// ✅ DOĞRU - Email hatalarını kullanıcıya gösterme
try {
  await sendOrderConfirmationEmail(order)
  // Kullanıcıya başarı mesajı gösterme, sessizce log
  console.log('Email gönderildi:', order.customerEmail)
} catch (error) {
  // Email hatasını kullanıcıya gösterme!
  console.error('Email gönderilemedi:', error)
  // Sipariş yine de devam etsin
}

// ❌ YANLIŞ - Email hatasını kullanıcıya gösterme
try {
  await sendEmail(order)
} catch (error) {
  toast.error(`Email gönderilemedi: ${error.message}`)
  // Email adresi, hata detayı gibi bilgiler açığa çıkabilir
}
```

## XSS Önleme

### React Otomatik Koruma

React varsayılan olarak XSS'e karşı korumalıdır:

```tsx
// ✅ GÜVENLİ - React otomatik escape eder
<div>{userInput}</div>

// ⚠️ RİSKLİ - dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// Eğer kullanacaksan, DOMPurify ile sanitize et!
```

## Best Practices Özet

1. **API keys asla commit etme** - Environment variables kullan
2. **Tüm input'ları validate et** - Zod, Yup gibi kütüphaneler kullan
3. **User input'u sanitize et** - XSS önleme
4. **3D Secure kullan** - Her ödeme işleminde
5. **Kredi kartı bilgisi saklama** - PCI-DSS ihlali
6. **CORS doğru yapılandır** - Sadece geçerli origin'lere izin ver
7. **Auth kontrolleri yap** - Cloud Functions'da
8. **Email hatalarını loglama** - Kullanıcıya gösterme
9. **Environment variables kontrol et** - Undefined kontrolü
10. **Rate limiting ekle** - DDoS önleme

## Güvenlik Checklist

Yeni bir feature eklerken kontrol et:

- [ ] API key'ler environment variable'da mı?
- [ ] Kullanıcı input'u validate ediliyor mu?
- [ ] Auth kontrolü var mı?
- [ ] CORS doğru yapılandırılmış mı?
- [ ] Hassas veri loglanmıyor mu?
- [ ] Error mesajları genel mi? (detay vermemeli)
- [ ] 3D Secure kullanılıyor mu?
- [ ] Rate limiting var mı?
