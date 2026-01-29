// src/services/visitorTrackingService.ts
// Frontend Visitor Tracking Service

import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../lib/firebase'
import type { JourneyStage, DeviceType, CartItemSummary, GeoLocation } from '../types/visitorTracking'

// Cloud Function referanslari
const initVisitorSessionFn = httpsCallable<{
  sessionId: string
  visitorId: string
  sessionData: Record<string, unknown>
}, {
  success: boolean
  sessionId: string
  geo: GeoLocation | null
}>(functions, 'initVisitorSession')

// ==========================================
// HELPER FUNCTIONS
// ==========================================

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

// Tarayici tespiti
const detectBrowser = (): string => {
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('SamsungBrowser')) return 'Samsung Browser'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return 'Diger'
}

// OS tespiti
const detectOS = (): string => {
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Diger'
}

// Ekran cozunurlugu
const getScreenResolution = (): string => {
  return `${window.screen.width}x${window.screen.height}`
}

// Referrer kaynagi
const getReferrerSource = (): string | null => {
  const referrer = document.referrer
  if (!referrer) return 'Direkt'

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()

    if (hostname.includes('google')) return 'Google'
    if (hostname.includes('instagram')) return 'Instagram'
    if (hostname.includes('facebook')) return 'Facebook'
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'Twitter/X'
    if (hostname.includes('youtube')) return 'YouTube'
    if (hostname.includes('tiktok')) return 'TikTok'
    if (hostname.includes('linkedin')) return 'LinkedIn'

    return hostname
  } catch {
    return referrer
  }
}

// IP Geolocation - Birden fazla API dene (fallback)
const fetchGeoLocation = async (): Promise<GeoLocation | null> => {
  // API 1: ipapi.co (günlük 1000 istek)
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      if (!data.error && data.country_name) {
        console.log('Geo alindi (ipapi.co):', data.city, data.region, data.country_name)
        return {
          country: data.country_name || null,
          countryCode: data.country_code || null,
          city: data.city || null,
          region: data.region || null
        }
      }
    }
  } catch (e) {
    console.warn('ipapi.co failed:', e)
  }

  // API 2: ip-api.com (HTTP ama fallback olarak)
  try {
    const response = await fetch('https://ipwho.is/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success !== false && data.country) {
        console.log('Geo alindi (ipwho.is):', data.city, data.region, data.country)
        return {
          country: data.country || null,
          countryCode: data.country_code || null,
          city: data.city || null,
          region: data.region || null
        }
      }
    }
  } catch (e) {
    console.warn('ipwho.is failed:', e)
  }

  console.warn('Tum geo API\'ler basarisiz')
  return null
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

// URL'den stage tespiti
const detectStageFromPath = (path: string): JourneyStage => {
  const lowerPath = path.toLowerCase()

  // Katalog sayfaları (İngilizce ve Türkçe)
  if (lowerPath.includes('/catalog') || lowerPath.includes('/urunler') ||
      lowerPath.includes('/kategori') || lowerPath.includes('/koleksiyon') ||
      lowerPath.includes('/bonbonlar') || lowerPath.includes('/campaigns')) {
    return 'catalog'
  }
  // Ürün detay sayfası (İngilizce ve Türkçe)
  if (lowerPath.includes('/product/') || lowerPath.includes('/urun/')) {
    return 'product'
  }
  // Sepet sayfası (İngilizce ve Türkçe)
  if (lowerPath.includes('/cart') || lowerPath.includes('/sepet')) {
    return 'cart'
  }
  // Ödeme sayfası (İngilizce ve Türkçe)
  if (lowerPath.includes('/checkout') || lowerPath.includes('/odeme')) {
    return 'checkout'
  }
  // Sipariş tamamlandı sayfası
  if (lowerPath.includes('/order-confirmation') || lowerPath.includes('/siparis-tamamlandi') ||
      lowerPath.includes('/tesekkurler')) {
    return 'completed'
  }

  return 'landing'
}

// ==========================================
// PUBLIC API
// ==========================================

/**
 * Session baslat veya devam et
 * Sayfa ilk yuklendiginde cagrilmali
 * Server-side geo detection kullanir (Wix gibi her zaman lokasyon gosterir)
 */
export const initSession = async (customerEmail?: string, customerName?: string): Promise<string> => {
  const sessionId = getOrCreateSessionId()
  const visitorId = getOrCreateVisitorId()
  const sessionRef = doc(db, 'sessions', sessionId)

  try {
    const existingSession = await getDoc(sessionRef)

    if (!existingSession.exists()) {
      // Yeni session - Cloud Function ile olustur (server-side geo)
      const isReturning = await checkReturningCustomer(visitorId)

      // Session data hazirla
      const sessionData = {
        visitorId,
        customerEmail: customerEmail || null,
        customerName: customerName || null,
        isReturningCustomer: isReturning,
        device: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
        screenResolution: getScreenResolution(),
        language: navigator.language || null,
        referrer: getReferrerSource(),
        currentStage: detectStageFromPath(window.location.pathname),
        cartValue: 0,
        cartItems: 0,
        cartItemsDetail: [],
        pagesVisited: [window.location.pathname],
        isActive: true
      }

      try {
        // Cloud Function cagir - server-side geo detection
        const result = await initVisitorSessionFn({
          sessionId,
          visitorId,
          sessionData
        })

        console.log('Session olusturuldu (server-side geo):', result.data.geo)
      } catch (fnError) {
        // Cloud Function basarisiz olursa client-side fallback
        console.warn('Cloud Function failed, falling back to client-side:', fnError)

        const geo = await fetchGeoLocation()
        await setDoc(sessionRef, {
          ...sessionData,
          geo: geo,
          startedAt: serverTimestamp(),
          lastActivityAt: serverTimestamp()
        })
      }
    } else {
      // Mevcut session'i guncelle
      const updates: Record<string, unknown> = {
        lastActivityAt: serverTimestamp(),
        isActive: true
      }

      // Geo yoksa Cloud Function ile yeniden dene
      if (!existingSession.data()?.geo) {
        try {
          const result = await initVisitorSessionFn({
            sessionId,
            visitorId,
            sessionData: {
              customerEmail: customerEmail || null,
              customerName: customerName || null
            }
          })
          console.log('Geo guncellendi (server-side):', result.data.geo)
        } catch {
          // Fallback - client-side geo
          const geo = await fetchGeoLocation()
          if (geo) updates.geo = geo
        }
      }

      if (customerEmail) updates.customerEmail = customerEmail
      if (customerName) updates.customerName = customerName

      await updateDoc(sessionRef, updates)
    }

    return sessionId
  } catch (error) {
    console.error('Session init error:', error)
    return sessionId
  }
}

/**
 * Sayfa goruntulemesi kaydet
 * Her route degisikliginde cagrilmali
 */
export const trackPageView = async (pagePath: string): Promise<void> => {
  const sessionId = getOrCreateSessionId()
  const visitorId = getOrCreateVisitorId()
  const sessionRef = doc(db, 'sessions', sessionId)

  try {
    const sessionSnap = await getDoc(sessionRef)

    if (!sessionSnap.exists()) {
      // Session yoksa olustur
      await initSession()
      return
    }

    const sessionData = sessionSnap.data()
    const currentPages = sessionData?.pagesVisited || []
    const newStage = detectStageFromPath(pagePath)

    const updates: Record<string, unknown> = {
      lastActivityAt: serverTimestamp(),
      currentStage: newStage,
      pagesVisited: [...currentPages, pagePath].slice(-50) // Son 50 sayfa
    }

    // Eger geo bilgisi yoksa server-side ile yeniden dene
    if (!sessionData?.geo) {
      try {
        // Server-side geo detection
        const result = await initVisitorSessionFn({
          sessionId,
          visitorId,
          sessionData: {}
        })
        if (result.data.geo) {
          console.log('Geo guncellendi (server-side):', result.data.geo)
          // Cloud Function zaten geo'yu guncelliyor, burada tekrar yapmaya gerek yok
        }
      } catch {
        // Fallback - client-side geo
        const geo = await fetchGeoLocation()
        if (geo) {
          updates.geo = geo
        }
      }
    }

    // Browser/OS bilgisi yoksa ekle
    if (!sessionData?.browser) {
      updates.browser = detectBrowser()
      updates.os = detectOS()
      updates.screenResolution = getScreenResolution()
      updates.language = navigator.language || null
      updates.referrer = getReferrerSource()
    }

    await updateDoc(sessionRef, updates)
  } catch (error) {
    console.error('Track page view error:', error)
  }
}

/**
 * Sepet guncellemesi kaydet
 * Sepete urun ekleme/cikarma islemlerinde cagrilmali
 */
export const trackCartUpdate = async (
  cartValue: number,
  cartItems: number,
  items: CartItemSummary[]
): Promise<void> => {
  const sessionId = getOrCreateSessionId()
  const sessionRef = doc(db, 'sessions', sessionId)

  try {
    const sessionSnap = await getDoc(sessionRef)

    if (!sessionSnap.exists()) {
      await initSession()
    }

    await updateDoc(sessionRef, {
      lastActivityAt: serverTimestamp(),
      currentStage: cartItems > 0 ? 'cart' : detectStageFromPath(window.location.pathname),
      cartValue,
      cartItems,
      cartItemsDetail: items
    })
  } catch (error) {
    console.error('Track cart update error:', error)
  }
}

/**
 * Checkout baslangici kaydet
 * Odeme sayfasina gecildiginde cagrilmali
 */
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

/**
 * Siparis tamamlandi kaydet
 * Basarili odeme sonrasi cagrilmali
 */
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

    // Session'i temizle - yeni ziyarette yeni session olusacak
    sessionStorage.removeItem('sade_session_id')
  } catch (error) {
    console.error('Track order completed error:', error)
  }
}

/**
 * Musteri bilgilerini guncelle
 * Login veya checkout formunda bilgi alindiktan sonra cagrilmali
 */
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

/**
 * Session ID'yi don - debug icin
 */
export const getCurrentSessionId = (): string => {
  return getOrCreateSessionId()
}

/**
 * Visitor ID'yi don - debug icin
 */
export const getCurrentVisitorId = (): string => {
  return getOrCreateVisitorId()
}
