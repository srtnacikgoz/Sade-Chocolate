---
name: payment-flow-audit
description: Use when modifying payment flow, checkout, order creation, email sending, callback handling, or debugging payment-related issues. Also use proactively after any change to Checkout.tsx, OrderConfirmation.tsx, functions/src/index.ts, or iyzicoService.ts. Triggers on "odeme", "payment", "iyzico", "callback", "siparis onay", "email gonderim", "guest checkout".
---

# Payment Flow Audit

## Overview

Odeme sonrasi akis, musterinin parasinin cekildigi andan siparis onay sayfasini gordugu ve email aldigi ana kadar olan **kritik zincir**dir. Bu zincirin herhangi bir halkasindaki kopukluk, musterinin "dolandirildim mi?" hissetmesine neden olur.

**Temel ilke:** Odeme alindiysa, musteri HER KOSULDA bilgilendirilmeli ve siparisine ulasabilmeli. Istisna yok.

## Kritik Zincir

```
Musteri Odemesi
    |
    v
Iyzico 3D Secure --> Iyzico Callback (Cloud Function)
    |
    v
Siparis Guncelleme (Firestore) --> Email Kuyruga Ekleme (await!)
    |
    v
Redirect --> App.tsx Callback Handler
    |
    v
OrderConfirmation Sayfasi (auth bekle + Firestore oku)
    |
    v
Musteri siparis detayini gorur + email alir
```

## Kontrol Edilmesi Gereken 7 Katman

Her degisiklikte asagidaki katmanlari tek tek dogrula. VARSAYIM YAPMA - kodu oku ve dogrula.

### 1. Siparis Olusturma (Checkout.tsx)

- [ ] `customerId: user.uid` set ediliyor mu? (giris yapmis kullanici icin)
- [ ] `isGuest: true/false` dogru set ediliyor mu?
- [ ] `customer.email` her durumda (guest + logged-in) dolduruluyor mu?
- [ ] Order `id` field'i gecerli formatta mi? (`SADE-xxx`)
- [ ] Firestore `addDoc` basarili mi, `firestoreOrderId` sakli mi?

### 2. Iyzico Entegrasyonu

- [ ] `basketId` ve `conversationId` = `orderData.id` (SADE-xxx formati)
- [ ] `callbackUrl` production URL'e (`sadechocolate.com/api/iyzico/callback`) isaret ediyor mu?
- [ ] `firebase.json` rewrite kurallarinda callback route dogru mu?
- [ ] Tum zorunlu Iyzico alanlari dolu mu? (buyer, address, basketItems)

### 3. Callback Handler (functions/src/index.ts - handleIyzicoCallback)

- [ ] `paymentResult.basketId` ile Firestore sorgusu eslesiyor mu?
- [ ] `.where('id', '==', orderId)` dogru field'i sorguluyor mu?
- [ ] Duplicate payment kontrolu var mi?
- [ ] Basarili odemede: `payment.status = 'paid'`, `status = 'processing'`
- [ ] Basarisiz odemede: `status = 'cancelled'`, retry bilgileri
- [ ] Redirect URL'de `firestoreOrderId` (Firestore doc ID) kullaniliyor mu? (`orderId` DEGIL!)

### 4. Email Gonderimi

- [ ] Email `sendPaymentEmail()` **await edilerek** mi cagriliyor? (redirect'ten ONCE kuyruklanmali)
- [ ] `customerEmail` null kontrolu var mi?
- [ ] Basarili odeme email'i: siparis detaylari, toplam, urunler
- [ ] Basarisiz odeme email'i: retry linki
- [ ] Retry URL'de `firestoreOrderId` kullaniliyor mu? (`orderId` = SADE-xxx KULLANILMAMALI)
- [ ] "Siparisi Takip Et" linki guest kullanicilar icin calisiyor mu? (`/account` DEGIL, `/order-confirmation/${firestoreOrderId}` olmali)
- [ ] "Siparis Sorgula" sayfasi linki var mi?

### 5. Redirect Akisi

- [ ] Callback: `res.redirect(sadechocolate.com/?payment=success&orderId=${firestoreOrderId})`
- [ ] App.tsx: `window.location.href = /order-confirmation/${orderId}` (firestoreOrderId)
- [ ] Basarisiz redirect: `/checkout?orderId=${firestoreOrderId}&retry=true`

### 6. OrderConfirmation Sayfasi

- [ ] `onAuthStateChanged` ile auth state bekleniyor mu? (3D Secure sonrasi race condition)
- [ ] `getDoc(doc(db, 'orders', orderId))` - firestoreOrderId ile Firestore doc ID'si sorgusu
- [ ] Hata durumunda "Siparis Sorgula" linki gorunuyor mu?
- [ ] Guest siparisler okunabiliyor mu? (Firestore rules: `isGuest == true`)
- [ ] Giris yapmis kullanici siparisleri okunabiliyor mu? (Firestore rules: `customerId == auth.uid`)

### 7. Guest Kullanici Deneyimi

- [ ] Guest siparis olusturulabiliyor mu?
- [ ] Guest siparis sonrasi onay sayfasi gorunuyor mu?
- [ ] Guest email aliyor mu?
- [ ] Guest `/siparis-takip` sayfasindan siparisini sorgulayabiliyor mu?
- [ ] Email'de siparis sorgula linki var mi?
- [ ] Guest retry yapabiliyor mu?

## ID Karisikligi - En Sik Hata

Sistemde IKI farkli ID var. Karistirma!

| ID | Format | Nereden Gelir | Nerede Kullanilir |
|----|--------|---------------|-------------------|
| `orderId` / `order.id` | `SADE-abc1234` | Checkout'ta `useState` ile uretilir | Iyzico basketId, email gosterim, musteri gorur |
| `firestoreOrderId` | Auto-generated UUID | `addDoc()` donusu | Firestore doc okuma, URL redirect, retry URL |

**KURAL:** URL'lerde, redirect'lerde ve retry linklerinde HER ZAMAN `firestoreOrderId` kullan. `orderId` (SADE-xxx) sadece gosterim ve Iyzico eslestirme icin.

## Firestore Rules Kontrolu

```
orders/{orderId}:
  read:  admin || (auth && customerId == uid) || isGuest == true
  create: true (guest checkout icin)
  update/delete: admin only
```

- Guest siparisler: `isGuest == true` → herkes okuyabilir (ID bilmesi gerekir)
- Giris yapmis: `customerId` field'i OLMALI → yoksa okuyamaz!
- Admin: her seyi okuyabilir

## Hata Senaryolari ve Beklenen Davranis

| Senaryo | Beklenen | Kontrol |
|---------|----------|---------|
| 3D Secure sonrasi sayfa yuklenemiyor | Siparis Sorgula linki gozukur | OrderConfirmation error state |
| Email kuyruklanma basarisiz | Log'a yazilir, redirect yine de olur | `await sendPaymentEmail().catch(...)` |
| Auth restore gecikmesi | `onAuthStateChanged` bekler | OrderConfirmation useEffect |
| Guest email'i kayip | Callback'te `customer.email` null kontrolu | Email gonderim blogu |
| Iyzico callback gelmiyor | Siparis `pending` kalir, timeout | Admin panel'den manuel islem |
| Duplicate callback | Ikinci callback skip edilir, redirect | `iyzicoPaymentId` duplicate check |

## Degisiklik Sonrasi Test Senaryolari

Bu dosyalardan birini degistirdiysen asagidaki senaryolari test et:

1. **Guest kredi karti odemesi** → Onay sayfasi + email
2. **Giris yapmis kullanici kredi karti** → Onay sayfasi + email
3. **Guest EFT odemesi** → Banka bilgileri ekrani + email
4. **Basarisiz odeme** → Retry linki calisir mi?
5. **Siparis Sorgula sayfasi** → Email + siparis no ile bulunuyor mu?

## Daha Once Yasanan Sorunlar

1. **customerId eksik** - Giris yapmis kullanicinin siparisine `customerId` yazilmiyordu → Firestore rules okumaya izin vermiyordu
2. **Auth race condition** - 3D Secure redirect sonrasi auth restore olmadan `getDoc` cagriliyordu
3. **Email retry URL yanlis ID** - `orderId` (SADE-xxx) yerine `firestoreOrderId` kullanilmasi gerekiyordu
4. **Email linki guest icin calismiyor** - `/account` yerine `/order-confirmation/${firestoreOrderId}` olmali
5. **Email await edilmeden redirect** - Email kuyruklanmadan redirect oluyordu
6. **Guest takip mekanizmasi yok** - `/siparis-takip` sayfasi eklendi
