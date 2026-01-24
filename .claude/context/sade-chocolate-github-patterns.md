# Sade Chocolate - GitHub Referans Patterns

> **Proje Spesifik GitHub Arama Şablonları**

Bu dosya, Sade Chocolate projesinde sık karşılaşılan senaryolar için hazır GitHub arama kalıplarını içerir.

**İlişkili Dosya:** `../Zihinsel-Algoritma-inşası.md` (Evrensel Metodoloji)

---

## 1. Ödeme Entegrasyonları

### İyzico Patterns
```bash
# İyzico React entegrasyonu
"iyzico" language:typescript stars:>10
filename:iyzico* language:javascript

# 3D Secure implementasyonu
"iyzico" "3dsecure" OR "3d secure" language:typescript
path:src "iyzico" "checkout" "callback"

# İyzico webhook handling
"iyzico" "webhook" OR "callback" language:typescript
filename:*.ts "iyzicoCallback" OR "handleIyzicoCallback"
```

### Genel Ödeme Sistemleri
```bash
# Checkout form best practices
filename:Checkout.tsx "payment" stars:>100
path:src/components "checkout" "form" language:typescript

# Payment error handling
"payment" "error" "retry" language:typescript path:src
```

---

## 2. Kargo Entegrasyonları

### MNG Kargo / DHL eCommerce
```bash
# MNG Kargo API
"mng kargo" OR "mngkargo" language:typescript
"dhl ecommerce" "turkey" OR "türkiye"

# Kargo takip implementasyonu
filename:*tracking* "shipment" language:typescript
path:src/services "tracking" "carrier"

# Shipping webhook patterns
"shipping" "webhook" "status" language:typescript
```

### Genel Kargo Patterns
```bash
# Address validation
"address" "validation" "turkey" OR "türkiye" language:typescript
filename:AddressForm* language:tsx

# Shipping cost calculation
"shipping" "cost" "calculate" language:typescript
path:src/services "desi" OR "kg" "shipping"
```

---

## 3. Firebase Patterns

### Authentication
```bash
# Firebase Auth with React
filename:useAuth* "firebase" language:typescript stars:>50
"firebase" "onAuthStateChanged" language:typescript

# Google Sign-In
"firebase" "GoogleAuthProvider" "signInWithPopup" language:typescript
path:src/context "auth" "firebase"

# Custom Claims (Admin)
"firebase" "customClaims" "admin" language:typescript
"setCustomUserClaims" language:typescript
```

### Firestore
```bash
# Real-time listeners
"onSnapshot" "firestore" language:typescript
filename:*Store.ts "firestore" "subscribe"

# Firestore security rules
filename:firestore.rules "orders" OR "users"
"firestore.rules" "request.auth" stars:>20

# Batch operations
"firestore" "writeBatch" OR "batch" language:typescript
```

### Cloud Functions
```bash
# Cloud Functions patterns
path:functions/src "onCall" language:typescript
"firebase-functions" "https" "onCall"

# Firestore triggers
"onDocumentCreated" OR "onDocumentWritten" language:typescript
path:functions "firestore" "trigger"

# Scheduled functions
"onSchedule" "firebase-functions" language:typescript
```

---

## 4. E-Ticaret Patterns

### Sepet Yönetimi
```bash
# Cart state management
filename:*Cart* "zustand" OR "context" language:typescript
path:src/stores "cart" language:typescript

# Cart persistence
"cart" "localStorage" "persist" language:typescript
"zustand" "persist" "cart"
```

### Sipariş Yönetimi
```bash
# Order management
filename:Order* path:src/components language:tsx stars:>50
"order" "status" "timeline" language:typescript

# Order confirmation email
"order" "confirmation" "email" "template" language:typescript
```

### Ürün Yönetimi
```bash
# Product variants
"product" "variant" "option" language:typescript
filename:ProductForm* language:tsx

# Inventory management
"inventory" "stock" "quantity" language:typescript
path:src "inventory" "update"
```

---

## 5. UI/UX Patterns

### Tailwind + React
```bash
# Modal patterns
filename:Modal* "tailwind" language:tsx stars:>100
"createPortal" "modal" "backdrop" language:tsx

# Form components
filename:*Form.tsx "tailwind" "input" stars:>50
"react-hook-form" "tailwind" language:tsx

# Toast/Notification
"toast" "notification" "tailwind" language:tsx
filename:Toast* language:tsx
```

### Responsive Design
```bash
# Mobile-first patterns
"responsive" "mobile" "tailwind" language:tsx
"md:" "lg:" "xl:" filename:*.tsx stars:>100
```

---

## 6. Email Templates

### SendGrid / Firebase Email
```bash
# SendGrid templates
"sendgrid" "template" "html" language:typescript
filename:email* "template" language:ts

# Firebase Trigger Email
"firebase" "mail" "collection" language:typescript
"trigger-email" "firestore"

# Responsive email HTML
"email" "template" "responsive" "table"
filename:*email*.html
```

---

## 7. Hata Çözümleri

### Sık Karşılaşılan Hatalar
```bash
# CORS errors
"CORS" "firebase" "functions" is:issue is:closed
"Access-Control-Allow-Origin" "cloud functions"

# Firestore permission denied
"permission-denied" "firestore" is:issue is:closed
"Missing or insufficient permissions" firebase

# iyzico errors
"iyzico" "error" OR "hata" is:issue
"iyzico" "10051" OR "10054" OR "10057"

# Firebase Auth errors
"auth/user-not-found" firebase is:issue is:closed
"auth/wrong-password" firebase
```

---

## 8. Performans Optimizasyonu

```bash
# React performance
"useMemo" "useCallback" "performance" language:tsx
"React.memo" "optimization" stars:>100

# Firebase query optimization
"firestore" "index" "composite" language:typescript
"firestore" "pagination" "cursor" language:typescript

# Image optimization
"next/image" OR "lazy" "loading" language:tsx
"cloudinary" OR "imgix" "optimization"
```

---

## 9. Test Patterns

```bash
# React Testing Library
"@testing-library/react" filename:*.test.tsx stars:>50
"render" "screen" "fireEvent" language:typescript

# Firebase emulator testing
"firebase" "emulator" "test" language:typescript
"connectFirestoreEmulator" language:typescript

# E2E testing
"cypress" "checkout" OR "cart" language:typescript
"playwright" "e-commerce"
```

---

## 10. Hızlı Referans Repoları

### Önerilen Repolar
| Repo | Kullanım Alanı |
|------|----------------|
| `vercel/commerce` | E-ticaret best practices |
| `medusajs/medusa` | Headless e-ticaret |
| `firebase/quickstart-js` | Firebase patterns |
| `tailwindlabs/tailwindcss` | Tailwind örnekleri |
| `react-hook-form/react-hook-form` | Form yönetimi |

### Arama Kısayolları
```bash
# Bu projeye benzer projeler
"react" "firebase" "ecommerce" "tailwind" stars:>200

# Türkiye e-ticaret
"türkiye" OR "turkey" "ecommerce" language:typescript

# Çikolata/Gıda e-ticaret
"chocolate" OR "food" "ecommerce" language:typescript
```

---

*Son Güncelleme: Ocak 2026*
*Proje: Sade Chocolate*
