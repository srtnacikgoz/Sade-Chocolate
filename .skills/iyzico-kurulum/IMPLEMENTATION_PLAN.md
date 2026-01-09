# İyzico Ödeme Entegrasyonu - İmplementasyon Planı

## Executive Summary

İyzico Checkout Form (iframe) entegrasyonu ile güvenli kredi kartı ödemesi sistemi kurulacak. Mevcut EFT/Havale sistemi benchmark alınarak, aynı kalitede state management, error handling ve email bildirimleri sağlanacak.

**Kullanıcı Tercihleri:**
- ✅ API Credentials hazır (production + sandbox)
- ✅ Checkout Form (iframe) - PCI DSS uyumlu, 3D Secure otomatik
- ✅ Taksit YOK (sadece tek çekim)
- ✅ Retry: Otomatik + email bildirimi

**Tahmini Süre:** 9-12 gün (4 sprint)

---

## Sprint 1: Backend Core (3-4 gün)

### 1.1 İyzico Service Layer
- NPM paketi: `npm install iyzipay --save`
- İyzico client initialization
- 3 metod: initializeCheckoutForm, retrieveCheckoutForm, verifyWebhookSignature

### 1.2 Cloud Functions Endpoints
- initializeIyzicoPayment (onCall)
- handleIyzicoCallback (onRequest)
- retryPayment (opsiyonel)

### 1.3 Firebase Configuration
- Environment variables (IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL)
- .env dosyası + .gitignore

### 1.4 Firestore Schema Update
- order.ts: İyzico-specific fields ekle (iyzicoPaymentId, cardFamily, lastFourDigits, vb.)

---

## Sprint 2: Frontend Integration (2-3 gün)

### 2.1 IyzicoCheckoutModal Component
- Dialog wrapper + iframe injection
- postMessage listener
- Loading/error states

### 2.2 Checkout.tsx Updates
- handleCardPayment() metodu
- handleIyzicoCallback() metodu
- Retry scenario handling

### 2.3 UI/UX
- Loading states
- Error messages (Türkçe)
- Success flow

---

## Sprint 3: Email & Admin (2 gün)

### 3.1 Email Templates
- paymentSuccessTemplate
- paymentFailedTemplate

### 3.2 Email Service
- sendPaymentConfirmation()
- sendPaymentFailedEmail()

### 3.3 Admin Panel
- Payment method icon
- Card info display
- İyzico Payment ID

---

## Sprint 4: Testing & Deploy (2-3 gün)

### 4.1 Sandbox Testing
- 7 test senaryosu (başarılı, failed, timeout, vb.)

### 4.2 Production Deployment
- Environment variables set
- Callback URL whitelist
- Firebase deploy
- Staged rollout

### 4.3 Monitoring
- Payment success rate
- Average payment time
- Error tracking

---

## Critical Files

**Yeni:**
1. functions/src/services/iyzicoService.ts
2. functions/src/templates/paymentConfirmation.ts
3. src/components/IyzicoCheckoutModal.tsx
4. functions/.env.production

**Güncellenecek:**
5. functions/src/index.ts
6. src/pages/Checkout.tsx
7. src/types/order.ts
8. src/components/admin/tabs/OrderManagementTab.tsx
9. functions/src/services/emailService.ts

---

## Data Flow

```
Kullanıcı → Checkout → handleCardPayment()
  ↓
initializeIyzicoPayment (Cloud Function)
  ↓
İyzico API: Create Checkout Form
  ↓
IyzicoCheckoutModal: iframe render
  ↓
Kullanıcı: Kart + 3D Secure
  ↓
İyzico Webhook: handleIyzicoCallback
  ↓
Firestore Update + Email
  ↓
Frontend: Order Confirmation
```

---

## Security

- API keys backend'de
- Webhook signature verification
- Payment amount validation
- Duplicate prevention
- PCI DSS compliance

---

## Testing

**Test Kartları:**
- Başarılı: 5890040000000016
- 3DS Failed: 5526080000000006
- Yetersiz Bakiye: 5406670000000009

**Senaryolar:**
1. Başarılı ödeme
2. 3D Secure failed
3. Yetersiz bakiye
4. Timeout
5. Duplicate prevention
6. Guest checkout
7. Loyalty points

---

## Rollback Plan

1. İyzico API Down → EFT'ye yönlendir
2. Webhook Sorun → Manuel verification
3. Critical Bug → Feature flag disable
