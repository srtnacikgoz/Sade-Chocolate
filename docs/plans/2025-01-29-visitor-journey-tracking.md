# Visitor Journey Tracking - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Site ziyaretcilerini ve musteri yolculugunu gercek zamanli takip eden, akilli Telegram bildirimleri gonderen, admin panelde dashboard gosteren sistem.

**Architecture:** Frontend'de session tracking service ile kullanici eventleri Firestore'a yazilir. Cloud Functions event-driven trigger'larla akilli bildirimler gonderir. Admin panelde real-time dashboard Firestore listener ile guncellenir.

**Tech Stack:** React, Firebase Firestore, Cloud Functions v2, Telegram Bot API, Firestore onSnapshot

---

## Veri Yapisi

### Firestore Collections

```
sessions/
  {sessionId}/
    - visitorId: string (anonim UUID veya customerId)
    - customerEmail: string | null
    - customerName: string | null
    - isReturningCustomer: boolean
    - device: 'mobile' | 'tablet' | 'desktop'
    - startedAt: Timestamp
    - lastActivityAt: Timestamp
    - currentStage: 'landing' | 'catalog' | 'product' | 'cart' | 'checkout' | 'completed' | 'abandoned'
    - cartValue: number
    - cartItems: number
    - pagesVisited: string[]
    - isActive: boolean

abandoned_carts/
  {cartId}/
    - sessionId: string
    - visitorId: string
    - customerEmail: string | null
    - customerName: string | null
    - cartValue: number
    - cartItems: CartItem[]
    - abandonedAt: Timestamp
    - stage: 'cart' | 'checkout'
    - notificationSent: boolean
    - recoveryEmailSent: boolean

daily_stats/
  {YYYY-MM-DD}/
    - totalVisitors: number
    - uniqueVisitors: number
    - cartAdditions: number
    - checkoutStarts: number
    - completedOrders: number
    - abandonedCarts: number
    - conversionRate: number
    - avgCartValue: number
```

---

## Task 1: Type Definitions

**Files:**
- Create: `src/types/visitorTracking.ts`

**Step 1: Create type definitions file**

```typescript
// src/types/visitorTracking.ts

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export type JourneyStage =
  | 'landing'
  | 'catalog'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'completed'
  | 'abandoned'

export type VisitorSession = {
  id: string
  visitorId: string
  customerEmail: string | null
  customerName: string | null
  isReturningCustomer: boolean
  device: DeviceType
  startedAt: Date
  lastActivityAt: Date
  currentStage: JourneyStage
  cartValue: number
  cartItems: number
  pagesVisited: string[]
  isActive: boolean
}

export type AbandonedCart = {
  id: string
  sessionId: string
  visitorId: string
  customerEmail: string | null
  customerName: string | null
  cartValue: number
  cartItems: CartItemSummary[]
  abandonedAt: Date
  stage: 'cart' | 'checkout'
  notificationSent: boolean
  recoveryEmailSent: boolean
}

export type CartItemSummary = {
  productId: string
  productName: string
  quantity: number
  price: number
}

export type DailyStats = {
  date: string
  totalVisitors: number
  uniqueVisitors: number
  cartAdditions: number
  checkoutStarts: number
  completedOrders: number
  abandonedCarts: number
  conversionRate: number
  avgCartValue: number
}

export type FunnelData = {
  landing: number
  catalog: number
  product: number
  cart: number
  checkout: number
  completed: number
}

export type JourneyStageConfig = {
  id: JourneyStage
  label: string
  icon: string
}

export const JOURNEY_STAGES: JourneyStageConfig[] = [
  { id: 'landing', label: 'Giris', icon: 'target' },
  { id: 'catalog', label: 'Katalog', icon: 'grid' },
  { id: 'product', label: 'Urun', icon: 'search' },
  { id: 'cart', label: 'Sepet', icon: 'shopping-cart' },
  { id: 'checkout', label: 'Odeme', icon: 'credit-card' },
  { id: 'completed', label: 'Tamamlandi', icon: 'check-circle' }
]
```

**Step 2: Commit**

```bash
git add src/types/visitorTracking.ts
git commit -m "feat(tracking): add visitor tracking type definitions"
```

---

## Task 2: Visitor Tracking Service (Frontend)

**Files:**
- Create: `src/services/visitorTrackingService.ts`

**Step 1: Create the tracking service**

```typescript
// src/services/visitorTrackingService.ts

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { JourneyStage, DeviceType, CartItemSummary } from '../types/visitorTracking'

// Visitor ID - localStorage'da sakla, yoksa olustur
const getOrCreateVisitorId = (): string => {
  const storageKey = 'sade_visitor_id'
  let visitorId = localStorage.getItem(storageKey)

  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(storageKey, visitorId)
  }

  return visitorId
}

// Session ID - sessionStorage'da sakla (tab bazli)
const getOrCreateSessionId = (): string => {
  const storageKey = 'sade_session_id'
  let sessionId = sessionStorage.getItem(storageKey)

  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(storageKey, sessionId)
  }

  return sessionId
}

// Cihaz tipi tespiti
const detectDevice = (): DeviceType => {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Geri donen musteri kontrolu
const checkReturningCustomer = async (visitorId: string): Promise<boolean> => {
  try {
    const visitorRef = doc(db, 'visitors', visitorId)
    const visitorSnap = await getDoc(visitorRef)
    return visitorSnap.exists() && (visitorSnap.data()?.orderCount || 0) > 0
  } catch {
    return false
  }
}

// Session baslat veya devam et
export const initSession = async (customerEmail?: string, customerName?: string): Promise<string> => {
  const sessionId = getOrCreateSessionId()
  const visitorId = getOrCreateVisitorId()
  const sessionRef = doc(db, 'sessions', sessionId)

  const existingSession = await getDoc(sessionRef)

  if (!existingSession.exists()) {
    const isReturning = await checkReturningCustomer(visitorId)

    await setDoc(sessionRef, {
      visitorId,
      customerEmail: customerEmail || null,
      customerName: customerName || null,
      isReturningCustomer: isReturning,
      device: detectDevice(),
      startedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      currentStage: 'landing' as JourneyStage,
      cartValue: 0,
      cartItems: 0,
      pagesVisited: [window.location.pathname],
      isActive: true
    })
  } else {
    // Mevcut session'i guncelle
    await updateDoc(sessionRef, {
      lastActivityAt: serverTimestamp(),
      isActive: true,
      ...(customerEmail && { customerEmail }),
      ...(customerName && { customerName })
    })
  }

  return sessionId
}

// Sayfa goruntulemesi kaydet
export const trackPageView = async (pagePath: string): Promise<void> => {
  const sessionId = getOrCreateSessionId()
  const sessionRef = doc(db, 'sessions', sessionId)

  try {
    const sessionSnap = await getDoc(sessionRef)
    if (!sessionSnap.exists()) {
      await initSession()
      return
    }

    const currentPages = sessionSnap.data()?.pagesVisited || []

    // Stage tespiti
    let newStage: JourneyStage = 'landing'
    if (pagePath.includes('/urunler') || pagePath.includes('/kategori')) {
      newStage = 'catalog'
    } else if (pagePath.includes('/urun/')) {
      newStage = 'product'
    } else if (pagePath.includes('/sepet')) {
      newStage = 'cart'
    } else if (pagePath.includes('/odeme') || pagePath.includes('/checkout')) {
      newStage = 'checkout'
    }

    await updateDoc(sessionRef, {
      lastActivityAt: serverTimestamp(),
      currentStage: newStage,
      pagesVisited: [...currentPages, pagePath].slice(-50) // Son 50 sayfa
    })
  } catch (error) {
    console.error('Track page view error:', error)
  }
}

// Sepet guncelleme
export const trackCartUpdate = async (cartValue: number, cartItems: number, items: CartItemSummary[]): Promise<void> => {
  const sessionId = getOrCreateSessionId()
  const sessionRef = doc(db, 'sessions', sessionId)

  try {
    await updateDoc(sessionRef, {
      lastActivityAt: serverTimestamp(),
      currentStage: 'cart' as JourneyStage,
      cartValue,
      cartItems,
      cartItemsDetail: items
    })
  } catch (error) {
    console.error('Track cart update error:', error)
  }
}

// Checkout baslangici
export const trackCheckoutStart = async (): Promise<void> => {
  const sessionId = getOrCreateSessionId()
  const sessionRef = doc(db, 'sessions', sessionId)

  try {
    await updateDoc(sessionRef, {
      lastActivityAt: serverTimestamp(),
      currentStage: 'checkout' as JourneyStage
    })
  } catch (error) {
    console.error('Track checkout start error:', error)
  }
}

// Siparis tamamlandi
export const trackOrderCompleted = async (orderId: string): Promise<void> => {
  const sessionId = getOrCreateSessionId()
  const visitorId = getOrCreateVisitorId()
  const sessionRef = doc(db, 'sessions', sessionId)

  try {
    await updateDoc(sessionRef, {
      lastActivityAt: serverTimestamp(),
      currentStage: 'completed' as JourneyStage,
      completedOrderId: orderId,
      isActive: false
    })

    // Visitor'in siparis sayisini artir
    const visitorRef = doc(db, 'visitors', visitorId)
    const visitorSnap = await getDoc(visitorRef)

    if (visitorSnap.exists()) {
      await updateDoc(visitorRef, {
        orderCount: (visitorSnap.data()?.orderCount || 0) + 1,
        lastOrderAt: serverTimestamp()
      })
    } else {
      await setDoc(visitorRef, {
        orderCount: 1,
        firstVisitAt: serverTimestamp(),
        lastOrderAt: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Track order completed error:', error)
  }
}

// Musteri bilgisi guncelle (login/checkout formunda)
export const updateCustomerInfo = async (email: string, name: string): Promise<void> => {
  const sessionId = getOrCreateSessionId()
  const sessionRef = doc(db, 'sessions', sessionId)

  try {
    await updateDoc(sessionRef, {
      customerEmail: email,
      customerName: name,
      lastActivityAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Update customer info error:', error)
  }
}
```

**Step 2: Commit**

```bash
git add src/services/visitorTrackingService.ts
git commit -m "feat(tracking): add visitor tracking service for frontend"
```

---

## Task 3: Cloud Functions - Abandoned Cart Detection

**Files:**
- Modify: `functions/src/index.ts` (append at end)

**Step 1: Add scheduled function for abandoned cart detection**

Dosyanin sonuna eklenecek kod:

```typescript
// ==========================================
// VISITOR JOURNEY TRACKING
// ==========================================

/**
 * Terk Edilmis Sepet Algilama - Her 5 dakikada calisir
 * 30 dakikadir hareketsiz cart/checkout session'lari tespit eder
 */
export const detectAbandonedCarts = onSchedule('every 5 minutes', async () => {
  const db = admin.firestore();
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  try {
    // Aktif cart/checkout session'lari bul
    const sessionsSnap = await db.collection('sessions')
      .where('isActive', '==', true)
      .where('currentStage', 'in', ['cart', 'checkout'])
      .where('lastActivityAt', '<', admin.firestore.Timestamp.fromDate(thirtyMinutesAgo))
      .get();

    if (sessionsSnap.empty) {
      functions.logger.info('Terk edilmis sepet bulunamadi');
      return;
    }

    const batch = db.batch();
    const abandonedCarts: any[] = [];

    for (const sessionDoc of sessionsSnap.docs) {
      const session = sessionDoc.data();

      // Session'i abandoned olarak isaretle
      batch.update(sessionDoc.ref, {
        currentStage: 'abandoned',
        isActive: false,
        abandonedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Abandoned cart kaydi olustur
      const abandonedCartRef = db.collection('abandoned_carts').doc();
      batch.set(abandonedCartRef, {
        sessionId: sessionDoc.id,
        visitorId: session.visitorId,
        customerEmail: session.customerEmail || null,
        customerName: session.customerName || null,
        cartValue: session.cartValue || 0,
        cartItems: session.cartItemsDetail || [],
        abandonedAt: admin.firestore.FieldValue.serverTimestamp(),
        stage: session.currentStage,
        notificationSent: false,
        recoveryEmailSent: false
      });

      // Telegram bildirimi icin listeye ekle (sadece 200 TL ustu)
      if (session.cartValue >= 200) {
        abandonedCarts.push({
          name: session.customerName || 'Anonim',
          email: session.customerEmail || '-',
          value: session.cartValue,
          items: session.cartItems || 0,
          stage: session.currentStage === 'checkout' ? 'Odeme' : 'Sepet'
        });
      }
    }

    await batch.commit();

    // Telegram bildirimi gonder (toplu)
    if (abandonedCarts.length > 0) {
      const cartList = abandonedCarts
        .map(c => `  - ${c.name}: ${c.value} TL (${c.items} urun, ${c.stage})`)
        .join('\n');

      const message = `
🛒 <b>TERK EDILEN SEPETLER</b>

${abandonedCarts.length} adet yuksek degerli sepet terk edildi:

${cartList}

🕐 ${new Date().toLocaleString('tr-TR')}
      `.trim();

      await sendTelegramMessage(message);
    }

    functions.logger.info(`${sessionsSnap.size} terk edilmis sepet algilandi`);
  } catch (error: any) {
    functions.logger.error('Abandoned cart detection error:', error.message);
  }
});

/**
 * VIP Musteri Bildirimi - Session olusturulunca tetiklenir
 * Daha once siparis vermis musteri siteye girdiginde bildirim
 */
export const onSessionCreated = onDocumentCreated('sessions/{sessionId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const session = snapshot.data();

  // Sadece geri donen musteriler icin bildirim
  if (!session.isReturningCustomer) return;

  // Musteri bilgisi yoksa bildirim gonderme
  if (!session.customerEmail && !session.customerName) return;

  const message = `
👋 <b>VIP MUSTERI SITEDE!</b>

<b>Musteri:</b> ${session.customerName || 'Bilinmiyor'}
<b>Email:</b> ${session.customerEmail || '-'}
<b>Cihaz:</b> ${session.device}

🕐 ${new Date().toLocaleString('tr-TR')}
  `.trim();

  await sendTelegramMessage(message);
});

/**
 * Checkout Baslangic Bildirimi
 * Musteri checkout'a gectigi anda bildirim (sepet degeri 300+ TL ise)
 */
export const onCheckoutStart = onDocumentCreated('sessions/{sessionId}', async (event) => {
  // Bu trigger session update'te calismiyor, onDocumentUpdated kullanmamiz lazim
  // Asagidaki task'ta eklenecek
});
```

**Step 2: Commit**

```bash
cd functions && git add src/index.ts
git commit -m "feat(tracking): add abandoned cart detection cloud function"
```

---

## Task 4: Cloud Functions - Checkout Alert & Daily Stats

**Files:**
- Modify: `functions/src/index.ts` (append)

**Step 1: Add checkout alert and daily stats functions**

```typescript
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

/**
 * Checkout Takip - Session guncellendikce kontrol et
 * Checkout'a gecildiginde ve 10 dk hareketsizlikte bildirim
 */
export const onSessionUpdated = onDocumentUpdated('sessions/{sessionId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  if (!before || !after) return;

  // Checkout'a gecis kontrolu
  if (before.currentStage !== 'checkout' && after.currentStage === 'checkout') {
    // Sadece 300 TL+ sepetler icin bildirim
    if (after.cartValue >= 300) {
      const message = `
💳 <b>CHECKOUT BASLADI!</b>

<b>Musteri:</b> ${after.customerName || 'Anonim'}
<b>Sepet:</b> ${after.cartValue} TL (${after.cartItems} urun)
<b>Cihaz:</b> ${after.device}

⏰ Siparis bekleniyor...

🕐 ${new Date().toLocaleString('tr-TR')}
      `.trim();

      await sendTelegramMessage(message);
    }
  }
});

/**
 * Gunluk Istatistik Hesaplama - Her gun gece yarisi calisir
 */
export const calculateDailyStats = onSchedule('0 0 * * *', async () => {
  const db = admin.firestore();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

  const startOfDay = new Date(dateStr);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Session'lari say
    const sessionsSnap = await db.collection('sessions')
      .where('startedAt', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
      .where('startedAt', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
      .get();

    const sessions = sessionsSnap.docs.map(d => d.data());

    // Unique visitor sayisi
    const uniqueVisitors = new Set(sessions.map(s => s.visitorId)).size;

    // Stage sayilari
    const cartAdditions = sessions.filter(s =>
      ['cart', 'checkout', 'completed', 'abandoned'].includes(s.currentStage)
    ).length;

    const checkoutStarts = sessions.filter(s =>
      ['checkout', 'completed', 'abandoned'].includes(s.currentStage)
    ).length;

    const completedOrders = sessions.filter(s => s.currentStage === 'completed').length;
    const abandonedCarts = sessions.filter(s => s.currentStage === 'abandoned').length;

    // Ortalama sepet degeri
    const cartsWithValue = sessions.filter(s => s.cartValue > 0);
    const avgCartValue = cartsWithValue.length > 0
      ? cartsWithValue.reduce((sum, s) => sum + s.cartValue, 0) / cartsWithValue.length
      : 0;

    // Donusum orani
    const conversionRate = sessions.length > 0
      ? (completedOrders / sessions.length) * 100
      : 0;

    // Kaydet
    await db.collection('daily_stats').doc(dateStr).set({
      date: dateStr,
      totalVisitors: sessions.length,
      uniqueVisitors,
      cartAdditions,
      checkoutStarts,
      completedOrders,
      abandonedCarts,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgCartValue: Math.round(avgCartValue),
      calculatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Telegram ozet raporu
    const message = `
📊 <b>GUNLUK RAPOR - ${dateStr}</b>

<b>Ziyaretci:</b> ${sessions.length} (${uniqueVisitors} tekil)
<b>Sepete Ekleme:</b> ${cartAdditions}
<b>Checkout:</b> ${checkoutStarts}
<b>Siparis:</b> ${completedOrders}
<b>Terk:</b> ${abandonedCarts}

<b>Donusum:</b> %${conversionRate.toFixed(1)}
<b>Ort. Sepet:</b> ${Math.round(avgCartValue)} TL
    `.trim();

    await sendTelegramMessage(message);

    functions.logger.info('Daily stats calculated:', dateStr);
  } catch (error: any) {
    functions.logger.error('Daily stats error:', error.message);
  }
});
```

**Step 2: Import statement guncelle**

Dosyanin basindaki import'a `onDocumentUpdated` ekle:

```typescript
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
```

**Step 3: Commit**

```bash
cd functions && git add src/index.ts
git commit -m "feat(tracking): add checkout alerts and daily stats functions"
```

---

## Task 5: Admin Dashboard - Journey Tracking Tab

**Files:**
- Replace: `src/components/admin/tabs/BehaviorTrackingTab.tsx`

**Step 1: Completely rewrite the component**

```typescript
// src/components/admin/tabs/BehaviorTrackingTab.tsx

import React, { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { Button } from '../../ui/Button'
import {
  Target, Grid, Search, ShoppingCart, CreditCard, CheckCircle,
  AlertTriangle, Users, TrendingUp, Mail, RefreshCw
} from 'lucide-react'
import type { VisitorSession, AbandonedCart, DailyStats, FunnelData } from '../../../types/visitorTracking'

const STAGE_CONFIG = [
  { id: 'landing', label: 'Giris', icon: Target, color: 'bg-gray-400' },
  { id: 'catalog', label: 'Katalog', icon: Grid, color: 'bg-blue-400' },
  { id: 'product', label: 'Urun', icon: Search, color: 'bg-purple-400' },
  { id: 'cart', label: 'Sepet', icon: ShoppingCart, color: 'bg-yellow-500' },
  { id: 'checkout', label: 'Odeme', icon: CreditCard, color: 'bg-orange-500' },
  { id: 'completed', label: 'Tamamlandi', icon: CheckCircle, color: 'bg-green-500' }
]

export const BehaviorTrackingTab: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<VisitorSession[]>([])
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([])
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null)
  const [funnelData, setFunnelData] = useState<FunnelData>({
    landing: 0, catalog: 0, product: 0, cart: 0, checkout: 0, completed: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Aktif session'lari dinle
  useEffect(() => {
    const sessionsRef = collection(db, 'sessions')
    const q = query(
      sessionsRef,
      where('isActive', '==', true),
      orderBy('lastActivityAt', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate() || new Date(),
        lastActivityAt: doc.data().lastActivityAt?.toDate() || new Date()
      })) as VisitorSession[]

      setActiveSessions(sessions)

      // Funnel hesapla
      const funnel: FunnelData = {
        landing: 0, catalog: 0, product: 0, cart: 0, checkout: 0, completed: 0
      }
      sessions.forEach(s => {
        if (s.currentStage in funnel) {
          funnel[s.currentStage as keyof FunnelData]++
        }
      })
      setFunnelData(funnel)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Bugunun terk edilmis sepetlerini dinle
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cartsRef = collection(db, 'abandoned_carts')
    const q = query(
      cartsRef,
      where('abandonedAt', '>=', Timestamp.fromDate(today)),
      orderBy('abandonedAt', 'desc'),
      limit(20)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const carts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        abandonedAt: doc.data().abandonedAt?.toDate() || new Date()
      })) as AbandonedCart[]

      setAbandonedCarts(carts)
    })

    return () => unsubscribe()
  }, [])

  // Bugunun istatistiklerini hesapla (session'lardan)
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessionsRef = collection(db, 'sessions')
    const q = query(
      sessionsRef,
      where('startedAt', '>=', Timestamp.fromDate(today))
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => doc.data())

      const uniqueVisitors = new Set(sessions.map(s => s.visitorId)).size
      const cartAdditions = sessions.filter(s =>
        ['cart', 'checkout', 'completed', 'abandoned'].includes(s.currentStage)
      ).length
      const completedOrders = sessions.filter(s => s.currentStage === 'completed').length
      const abandonedCount = sessions.filter(s => s.currentStage === 'abandoned').length

      const cartsWithValue = sessions.filter(s => s.cartValue > 0)
      const avgCartValue = cartsWithValue.length > 0
        ? cartsWithValue.reduce((sum, s) => sum + (s.cartValue || 0), 0) / cartsWithValue.length
        : 0

      const conversionRate = sessions.length > 0
        ? (completedOrders / sessions.length) * 100
        : 0

      setTodayStats({
        date: today.toISOString().split('T')[0],
        totalVisitors: sessions.length,
        uniqueVisitors,
        cartAdditions,
        checkoutStarts: sessions.filter(s => ['checkout', 'completed'].includes(s.currentStage)).length,
        completedOrders,
        abandonedCarts: abandonedCount,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgCartValue: Math.round(avgCartValue)
      })
    })

    return () => unsubscribe()
  }, [])

  const formatTimeAgo = (date: Date): string => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return 'Simdi'
    if (minutes < 60) return `${minutes}dk once`
    const hours = Math.floor(minutes / 60)
    return `${hours}sa once`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-mustard" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brown-900 dark:text-white">
            Musteri Yolculuk Takibi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gercek zamanli ziyaretci ve sepet analizi
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {activeSessions.length} Aktif Ziyaretci
          </span>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-cream-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
          Ziyaretci Akisi (Son 1 Saat)
        </h3>
        <div className="flex items-end justify-between gap-4">
          {STAGE_CONFIG.map((stage, idx) => {
            const count = funnelData[stage.id as keyof FunnelData] || 0
            const maxCount = Math.max(...Object.values(funnelData), 1)
            const height = Math.max((count / maxCount) * 120, 20)
            const Icon = stage.icon

            return (
              <div key={stage.id} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-2xl font-bold text-brown-900 dark:text-white">
                  {count}
                </span>
                <div
                  className={`w-full ${stage.color} rounded-t-lg transition-all duration-500`}
                  style={{ height: `${height}px` }}
                />
                <div className="flex flex-col items-center gap-1">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-500 text-center">
                    {stage.label}
                  </span>
                </div>
                {idx < STAGE_CONFIG.length - 1 && (
                  <div className="absolute right-0 top-1/2 w-4 h-0.5 bg-gray-200" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats Grid */}
      {todayStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Ziyaretci" value={todayStats.totalVisitors} icon={Users} />
          <StatCard label="Tekil" value={todayStats.uniqueVisitors} icon={Users} />
          <StatCard label="Sepet" value={todayStats.cartAdditions} icon={ShoppingCart} />
          <StatCard label="Siparis" value={todayStats.completedOrders} icon={CheckCircle} color="green" />
          <StatCard label="Terk" value={todayStats.abandonedCarts} icon={AlertTriangle} color="red" />
          <StatCard label="Donusum" value={`%${todayStats.conversionRate}`} icon={TrendingUp} />
        </div>
      )}

      {/* Abandoned Carts */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-cream-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Terk Edilen Sepetler (Bugun: {abandonedCarts.length})
          </h3>
        </div>

        {abandonedCarts.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            Bugun terk edilen sepet yok
          </p>
        ) : (
          <div className="space-y-3">
            {abandonedCarts.map(cart => (
              <div
                key={cart.id}
                className="flex items-center justify-between p-4 bg-cream-50 dark:bg-dark-700 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-900 dark:text-white">
                      {cart.customerName || 'Anonim Ziyaretci'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cart.customerEmail || 'Email yok'} - {cart.cartItems.length} urun
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg text-brown-900 dark:text-white">
                      {cart.cartValue.toLocaleString('tr-TR')} TL
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimeAgo(cart.abandonedAt)}
                    </p>
                  </div>
                  {cart.customerEmail && !cart.recoveryEmailSent && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        // TODO: Recovery email gonder
                        console.log('Send recovery email to:', cart.customerEmail)
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Sessions List */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-cream-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
          Aktif Ziyaretciler
        </h3>

        {activeSessions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            Su an aktif ziyaretci yok
          </p>
        ) : (
          <div className="space-y-2">
            {activeSessions.slice(0, 10).map(session => {
              const stageConfig = STAGE_CONFIG.find(s => s.id === session.currentStage)
              const StageIcon = stageConfig?.icon || Target

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 hover:bg-cream-50 dark:hover:bg-dark-700 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${stageConfig?.color || 'bg-gray-400'} rounded-lg flex items-center justify-center`}>
                      <StageIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-brown-900 dark:text-white">
                        {session.customerName || 'Anonim'}
                        {session.isReturningCustomer && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            VIP
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {session.device} - {stageConfig?.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {session.cartValue > 0 && (
                      <p className="font-semibold text-brown-900 dark:text-white">
                        {session.cartValue.toLocaleString('tr-TR')} TL
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatTimeAgo(session.lastActivityAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard: React.FC<{
  label: string
  value: string | number
  icon: React.FC<{ className?: string }>
  color?: 'green' | 'red'
}> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-cream-200 dark:border-gray-700">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${
        color === 'green' ? 'text-green-500' :
        color === 'red' ? 'text-red-500' :
        'text-gray-400'
      }`} />
      <span className="text-xs text-gray-500 uppercase">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${
      color === 'green' ? 'text-green-600' :
      color === 'red' ? 'text-red-600' :
      'text-brown-900 dark:text-white'
    }`}>
      {value}
    </p>
  </div>
)
```

**Step 2: Commit**

```bash
git add src/components/admin/tabs/BehaviorTrackingTab.tsx
git commit -m "feat(tracking): replace demo with real-time journey dashboard"
```

---

## Task 6: Integrate Tracking into App

**Files:**
- Modify: `src/App.tsx` - Add tracking initialization
- Modify: `src/pages/Checkout.tsx` - Track checkout events
- Modify: `src/context/CartContext.tsx` veya ilgili cart dosyasi - Track cart updates

**Step 1: App.tsx'e tracking ekle**

App.tsx'in useEffect'ine eklenecek:

```typescript
import { initSession, trackPageView } from './services/visitorTrackingService'

// App component icinde, useEffect ile:
useEffect(() => {
  // Session baslat
  initSession()

  // Sayfa degisikliklerini takip et
  trackPageView(window.location.pathname)
}, [])

// React Router kullaniyorsaniz, location degisikliginde:
useEffect(() => {
  trackPageView(location.pathname)
}, [location.pathname])
```

**Step 2: Checkout.tsx'e tracking ekle**

Checkout sayfasinin basinda:

```typescript
import { trackCheckoutStart, updateCustomerInfo } from '../services/visitorTrackingService'

// Component mount oldugunda
useEffect(() => {
  trackCheckoutStart()
}, [])

// Form submit edildiginde (musteri bilgileri alindiktan sonra)
const handleCustomerInfoSubmit = (email: string, name: string) => {
  updateCustomerInfo(email, name)
  // ... diger islemler
}
```

**Step 3: Cart update tracking**

Sepete urun eklendiginde/cikarildiginda:

```typescript
import { trackCartUpdate } from '../services/visitorTrackingService'

// Sepet her guncellediginde
const updateCart = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  trackCartUpdate(total, itemCount, items.map(i => ({
    productId: i.id,
    productName: i.name,
    quantity: i.quantity,
    price: i.price
  })))
}
```

**Step 4: Commit**

```bash
git add src/App.tsx src/pages/Checkout.tsx src/context/CartContext.tsx
git commit -m "feat(tracking): integrate visitor tracking into app flow"
```

---

## Task 7: Deploy & Test

**Step 1: Build ve local test**

```bash
npm run build
```

**Step 2: Functions deploy**

```bash
cd functions && npm run deploy
```

**Step 3: Full deploy (kullanici onayiyla)**

```bash
firebase deploy
```

**Step 4: Test senaryolari**

1. Siteye gir, birka sayfa gez - Session olusturuldugunu kontrol et
2. Sepete urun ekle - Cart tracking calistigini kontrol et
3. Checkout'a git ama tamamlama - 30 dk bekle, abandoned cart algilanmali
4. Admin panelde Yolculuk Takibi sayfasini ac - Gercek veri gorunmeli

---

## Ozet

| Task | Dosya | Aciklama |
|------|-------|----------|
| 1 | `src/types/visitorTracking.ts` | Type definitions |
| 2 | `src/services/visitorTrackingService.ts` | Frontend tracking service |
| 3 | `functions/src/index.ts` | Abandoned cart detection |
| 4 | `functions/src/index.ts` | Checkout alerts + daily stats |
| 5 | `src/components/admin/tabs/BehaviorTrackingTab.tsx` | Real-time dashboard |
| 6 | `src/App.tsx`, `Checkout.tsx`, `CartContext.tsx` | App integration |
| 7 | Deploy | Test & deploy |

Toplam: 7 task, tahmini 15-20 commit
