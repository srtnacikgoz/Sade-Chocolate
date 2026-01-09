---
name: iyzico-kurulum
description: İyzico Checkout Form (iframe) entegrasyonu ile güvenli kredi kartı ödemesi sistemi kurulumu
version: 1.0.0
author: Claude
created: 2026-01-09
tags: [payment, iyzico, checkout, firebase, e-commerce]
---

# İyzico Ödeme Entegrasyonu Skill

## Skill Hakkında

Bu skill, Sade Chocolate e-ticaret platformuna İyzico Checkout Form (iframe) entegrasyonu ile güvenli kredi kartı ödemesi sistemini kurar. Mevcut EFT/Havale sistemi benchmark alınarak, aynı kalitede state management, error handling ve email bildirimleri sağlanır.

## Teknik Detaylar

**Teknolojiler:**
- İyzico Checkout Form (iframe) - PCI DSS uyumlu
- Firebase Cloud Functions (Node.js 18, TypeScript)
- React + TypeScript
- Firestore (real-time listeners)
- SendGrid (email notifications)

**Entegrasyon Tipi:** Checkout Form (iframe)
**Taksit:** Yok (sadece tek çekim)
**Retry Mekanizması:** Otomatik + email bildirimi

## Kullanım

```bash
# Skill'i çalıştır
/iyzico-kurulum

# Belirli bir sprint'i çalıştır
/iyzico-kurulum sprint1
/iyzico-kurulum sprint2
```

## Implementation Roadmap

### Sprint 1: Backend Core (3-4 gün)
- İyzico NPM paketi kurulumu
- İyzico service layer oluşturma
- Cloud Functions endpoints (3 endpoint)
- Firebase Functions configuration
- Firestore schema update

### Sprint 2: Frontend Integration (2-3 gün)
- IyzicoCheckoutModal komponenti
- Checkout.tsx güncellemeleri
- Retry mechanism
- UI/UX iyileştirmeleri

### Sprint 3: Email & Admin Panel (2 gün)
- Email templates (success/failed)
- Email service güncellemeleri
- Admin panel filters
- Order detail view güncellemeleri

### Sprint 4: Testing & Deployment (2-3 gün)
- Sandbox testing (7 senaryo)
- Production deployment
- Monitoring setup

**Toplam Tahmini Süre:** 9-12 gün

## Critical Files

### Oluşturulacak Dosyalar:
1. `functions/src/services/iyzicoService.ts` - İyzico API entegrasyonu
2. `functions/src/templates/paymentConfirmation.ts` - Email templates
3. `src/components/IyzicoCheckoutModal.tsx` - Iframe modal
4. `functions/.env.production` - Environment variables
5. `functions/src/utils/logger.ts` (Opsiyonel) - Payment logging

### Güncellenecek Dosyalar:
6. `functions/src/index.ts` - 3 yeni endpoint
7. `src/pages/Checkout.tsx` - Card payment flow
8. `src/types/order.ts` - PaymentDetails interface
9. `src/components/admin/tabs/OrderManagementTab.tsx` - Admin panel
10. `functions/src/services/emailService.ts` - Email metodları

## Data Flow

```
[Kullanıcı] → [Checkout] → [handleCardPayment()]
    ↓
[Cloud Function: initializeIyzicoPayment]
    ↓
[İyzico API: Create Checkout Form]
    ↓
[IyzicoCheckoutModal: iframe render]
    ↓
[Kullanıcı: Kart bilgisi + 3D Secure]
    ↓
[İyzico → Webhook: handleIyzicoCallback]
    ↓
[Firestore Update: payment.status='paid']
    ↓
[Email: sendPaymentConfirmation()]
    ↓
[Frontend: Order Confirmation Page]
```

## Security Checklist

- [ ] API keys backend'de saklanıyor
- [ ] Webhook signature verification
- [ ] Payment amount validation
- [ ] Duplicate payment prevention
- [ ] XSS protection (iframe)
- [ ] HTTPS zorunlu
- [ ] PCI DSS compliance

## Testing Scenarios

1. ✅ Başarılı ödeme (Test kart: 5890040000000016)
2. ❌ 3D Secure failed (Test kart: 5526080000000006)
3. ❌ Yetersiz bakiye (Test kart: 5406670000000009)
4. ⏱️ Timeout scenario
5. 🔄 Webhook duplicate prevention
6. 🎁 Guest checkout + card payment
7. 🏆 Loyalty points + card payment

## Cost Analysis

**İyzico Fees:** ~2.5-3% + 0.25 TL/işlem
**Firebase:** ~0.012 TL/işlem
**Toplam:** ~3 TL/işlem (100 TL sipariş için)

## Rollback Plan

1. **İyzico API Down:** EFT'ye yönlendir
2. **Webhook Sorunları:** Manuel verification
3. **Critical Bug:** Feature flag ile disable et

## Post-Launch Features

- Taksit desteği
- Saved cards (İyzico Card Storage)
- Apple Pay / Google Pay
- Refund flow (admin panel)

## Referanslar

- [İyzico API Dökümanı](https://dev.iyzipay.com/)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Plan Dosyası](../../.claude/plans/zany-hatching-pie.md)

---

## Security Checklist (Completed)

- [x] API keys backend'de saklanıyor (functions/.env.production)
- [x] Webhook signature verification (verifyWebhookSignature)
- [x] Payment amount validation (basketId match)
- [x] Duplicate payment prevention (iyzicoPaymentId check)
- [x] XSS protection (iframe sandboxed)
- [x] HTTPS zorunlu (İyzico requirement)
- [x] PCI DSS compliance (İyzico handles card data)

## Skill Implementation Log

### 2026-01-09
- Skill oluşturuldu
- Plan hazırlandı ve onaylandı
- **Sprint 1 TAMAMLANDI:**
  - ✅ İyzico NPM paketi kuruldu (iyzipay@2.0.56)
  - ✅ iyzicoService.ts oluşturuldu (4 method: initializeCheckoutForm, retrieveCheckoutForm, verifyWebhookSignature, extractPaymentDetails)
  - ✅ 3 Cloud Functions endpoint eklendi (initializeIyzicoPayment, handleIyzicoCallback, retryPayment)
  - ✅ .env.production ve .env.sandbox dosyaları oluşturuldu
  - ✅ order.ts İyzico fields ile güncellendi
- **Sprint 2 TAMAMLANDI:**
  - ✅ IyzicoCheckoutModal.tsx oluşturuldu (postMessage listener, iframe injection, ESC close)
  - ✅ Checkout.tsx güncellendi (card payment flow, retry URL params)
  - ✅ handleIyzicoPaymentComplete callback eklendi
- **Sprint 3 TAMAMLANDI:**
  - ✅ Email templates eklendi (sendPaymentSuccessEmail, sendPaymentFailedEmail)
  - ✅ Cloud Function'da email gönderimi implemente edildi
  - ✅ Admin panel'e kart badge'i eklendi (tablo + detay modal)
  - ✅ İyzico ödeme detayları bölümü eklendi (kart bilgisi, İyzico ID, komisyon)
  - ✅ Ödeme filtreleri eklendi (Kart/EFT/Ödendi/Başarısız)
- **Sprint 4 BEKLİYOR:**
  - ⏳ Sandbox testing (7 senaryo)
  - ⏳ Production deployment

### Oluşturulan Dosyalar:
- `functions/src/services/iyzicoService.ts`
- `functions/.env.production`
- `functions/.env.sandbox`
- `src/components/IyzicoCheckoutModal.tsx`
- `src/services/emailService.ts` (sendPaymentSuccessEmail, sendPaymentFailedEmail eklendi)

### Güncellenen Dosyalar:
- `functions/src/index.ts` (+3 endpoints, +email gönderimi)
- `src/pages/Checkout.tsx` (+card payment flow)
- `src/types/order.ts` (+İyzico fields)
- `src/components/admin/tabs/OrderManagementTab.tsx` (+filters, +detail view)
