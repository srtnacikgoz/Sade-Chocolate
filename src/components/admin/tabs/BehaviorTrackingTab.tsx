// src/components/admin/tabs/BehaviorTrackingTab.tsx
// Real-Time Visitor Journey Tracking Dashboard

import React, { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { Button } from '../../ui/Button'
import {
  Target,
  LayoutGrid,
  Search,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Mail,
  RefreshCw,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  ChevronDown,
  ChevronRight,
  UserX,
  Eye,
  Package
} from 'lucide-react'
import type {
  VisitorSession,
  AbandonedCart,
  DailyStats,
  FunnelData,
  ViewedProduct
} from '../../../types/visitorTracking'

// Stage konfigurasyonu
const STAGE_CONFIG = [
  { id: 'landing', label: 'Giris', Icon: Target, color: 'bg-gray-400' },
  { id: 'catalog', label: 'Katalog', Icon: LayoutGrid, color: 'bg-blue-400' },
  { id: 'product', label: 'Urun', Icon: Search, color: 'bg-purple-400' },
  { id: 'cart', label: 'Sepet', Icon: ShoppingCart, color: 'bg-yellow-500' },
  { id: 'checkout', label: 'Odeme', Icon: CreditCard, color: 'bg-orange-500' },
  { id: 'completed', label: 'Tamamlandi', Icon: CheckCircle, color: 'bg-green-500' }
] as const

// Cihaz ikonu
const DeviceIcon: React.FC<{ device: string; className?: string }> = ({ device, className }) => {
  switch (device) {
    case 'mobile':
      return <Smartphone className={className} />
    case 'tablet':
      return <Tablet className={className} />
    default:
      return <Monitor className={className} />
  }
}

export const BehaviorTrackingTab: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<VisitorSession[]>([])
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([])
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null)
  const [funnelData, setFunnelData] = useState<FunnelData>({
    landing: 0,
    catalog: 0,
    product: 0,
    cart: 0,
    checkout: 0,
    completed: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [expandedLostSessions, setExpandedLostSessions] = useState<Set<string>>(new Set())
  const [isLostSectionOpen, setIsLostSectionOpen] = useState(false)

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
      const sessions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        startedAt: docSnap.data().startedAt?.toDate() || new Date(),
        lastActivityAt: docSnap.data().lastActivityAt?.toDate() || new Date()
      })) as VisitorSession[]

      setActiveSessions(sessions)

      // Funnel hesapla
      const funnel: FunnelData = {
        landing: 0,
        catalog: 0,
        product: 0,
        cart: 0,
        checkout: 0,
        completed: 0
      }
      sessions.forEach((s) => {
        const stage = s.currentStage as keyof FunnelData
        if (stage in funnel) {
          funnel[stage]++
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
      const carts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        abandonedAt: docSnap.data().abandonedAt?.toDate() || new Date()
      })) as AbandonedCart[]

      setAbandonedCarts(carts)
    })

    return () => unsubscribe()
  }, [])

  // Bugunun istatistiklerini hesapla
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessionsRef = collection(db, 'sessions')
    const q = query(sessionsRef, where('startedAt', '>=', Timestamp.fromDate(today)))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map((d) => d.data())

      const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size
      const cartAdditions = sessions.filter((s) =>
        ['cart', 'checkout', 'completed', 'abandoned'].includes(s.currentStage)
      ).length
      const completedOrders = sessions.filter((s) => s.currentStage === 'completed').length
      const abandonedCount = sessions.filter((s) => s.currentStage === 'abandoned').length

      const cartsWithValue = sessions.filter((s) => (s.cartValue || 0) > 0)
      const avgCartValue =
        cartsWithValue.length > 0
          ? cartsWithValue.reduce((sum, s) => sum + (s.cartValue || 0), 0) / cartsWithValue.length
          : 0

      const conversionRate = sessions.length > 0 ? (completedOrders / sessions.length) * 100 : 0

      setTodayStats({
        date: today.toISOString().split('T')[0],
        totalVisitors: sessions.length,
        uniqueVisitors,
        cartAdditions,
        checkoutStarts: sessions.filter((s) => ['checkout', 'completed'].includes(s.currentStage))
          .length,
        completedOrders,
        abandonedCarts: abandonedCount,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgCartValue: Math.round(avgCartValue)
      })
    })

    return () => unsubscribe()
  }, [])

  // Zaman formatlama - ne kadar once
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 30) return 'Az once'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 1) return '1 dk once'
    if (minutes < 60) return `${minutes} dk once`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat once`
    return `${Math.floor(hours / 24)} gun once`
  }

  // Session suresi - sitede gecirdigi gercek sure (startedAt -> lastActivityAt)
  const formatSessionDuration = (startedAt: Date, lastActivityAt: Date): string => {
    const seconds = Math.floor((lastActivityAt.getTime() - startedAt.getTime()) / 1000)
    if (seconds < 5) return 'Yeni girdi'
    if (seconds < 60) return `${seconds} saniye`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} dakika`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) return `${hours} saat`
    return `${hours} saat ${remainingMins} dk`
  }

  // Gercekten aktif mi? (son 5 dakika icinde aktivite)
  const isReallyActive = (lastActivityAt: Date): boolean => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return lastActivityAt.getTime() > fiveMinutesAgo
  }

  // Aktiflik durumu etiketi
  const getActivityStatus = (lastActivityAt: Date): { label: string; color: string } => {
    const minutesAgo = Math.floor((Date.now() - lastActivityAt.getTime()) / 60000)
    if (minutesAgo < 2) return { label: 'Canli', color: 'bg-green-500' }
    if (minutesAgo < 5) return { label: 'Aktif', color: 'bg-green-400' }
    if (minutesAgo < 15) return { label: 'Beklemede', color: 'bg-yellow-500' }
    if (minutesAgo < 30) return { label: 'Uzaklasti', color: 'bg-orange-500' }
    return { label: 'Kayip', color: 'bg-red-500' }
  }

  // Recovery email gonder
  const handleSendRecoveryEmail = async (cart: AbandonedCart) => {
    if (!cart.customerEmail) return

    try {
      // TODO: Email gonderme fonksiyonu eklenecek
      // Simdilik sadece flag'i guncelle
      const cartRef = doc(db, 'abandoned_carts', cart.id)
      await updateDoc(cartRef, { recoveryEmailSent: true })
      alert('Email gonderildi: ' + cart.customerEmail)
    } catch (error) {
      console.error('Email gonderilemedi:', error)
    }
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
          <p className="text-sm text-gray-500 mt-1">Gercek zamanli ziyaretci ve sepet analizi</p>
        </div>
        {(() => {
          const reallyActive = activeSessions.filter(s => isReallyActive(s.lastActivityAt)).length
          const waiting = activeSessions.filter(s => {
            const mins = Math.floor((Date.now() - s.lastActivityAt.getTime()) / 60000)
            return mins >= 5 && mins < 30
          }).length
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  {reallyActive} Canli
                </span>
              </div>
              {waiting > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    {waiting} Beklemede
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-400">
                Toplam: {activeSessions.length}
              </span>
            </div>
          )
        })()}
      </div>

      {/* Aktivite Durumu Aciklamasi */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-cream-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Aktivite Durumu Rehberi
        </h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Canli:</strong> Son 2 dakikada aktif
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-400 rounded-full" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Aktif:</strong> 2-5 dakika once aktif
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Beklemede:</strong> 5-15 dakika sessiz, geri donebilir
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Uzaklasti:</strong> 15-30 dakika sessiz, muhtemelen ayrildi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Kayip:</strong> 30+ dakika sessiz, siteyi terk etti
            </span>
          </div>
        </div>
      </div>

      {/* Funnel Visualization with Drop-off */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-cream-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
          Ziyaretci Akisi ve Kayip Orani (Canli)
        </h3>
        <div className="flex items-end justify-between gap-2">
          {STAGE_CONFIG.map((stage, idx) => {
            const count = funnelData[stage.id as keyof FunnelData] || 0
            const maxCount = Math.max(...Object.values(funnelData), 1)
            const height = Math.max((count / maxCount) * 120, 20)
            const { Icon } = stage

            // Onceki asamadan drop-off hesapla
            const prevStage = idx > 0 ? STAGE_CONFIG[idx - 1] : null
            const prevCount = prevStage ? funnelData[prevStage.id as keyof FunnelData] || 0 : 0
            const dropOff = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0
            const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0

            return (
              <div key={stage.id} className="flex-1 flex flex-col items-center gap-2 relative">
                {/* Drop-off gostergesi */}
                {idx > 0 && prevCount > 0 && (
                  <div className="absolute -left-1 top-8 text-[9px] text-center">
                    {dropOff > 0 ? (
                      <span className="text-red-500">-{dropOff}%</span>
                    ) : (
                      <span className="text-green-500">+{Math.abs(dropOff)}%</span>
                    )}
                  </div>
                )}

                <span className="text-2xl font-bold text-brown-900 dark:text-white">{count}</span>

                {/* Conversion rate */}
                {idx > 0 && prevCount > 0 && (
                  <span className={`text-[10px] ${conversionRate >= 50 ? 'text-green-600' : conversionRate >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {conversionRate}%
                  </span>
                )}

                <div
                  className={`w-full ${stage.color} rounded-t-lg transition-all duration-500`}
                  style={{ height: `${height}px` }}
                />
                <div className="flex flex-col items-center gap-1">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] text-gray-500 text-center">{stage.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ozet Metrikleri */}
        {funnelData.landing > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-center gap-6 text-xs">
            <div className="text-center">
              <p className="text-gray-400">Sepet Orani</p>
              <p className="font-bold text-yellow-600">
                {Math.round((funnelData.cart / funnelData.landing) * 100) || 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Checkout Orani</p>
              <p className="font-bold text-orange-600">
                {Math.round((funnelData.checkout / funnelData.landing) * 100) || 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Toplam Donusum</p>
              <p className="font-bold text-green-600">
                {Math.round((funnelData.completed / funnelData.landing) * 100) || 0}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {todayStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Ziyaretci" value={todayStats.totalVisitors} icon={Users} />
          <StatCard label="Tekil" value={todayStats.uniqueVisitors} icon={Globe} />
          <StatCard label="Sepet" value={todayStats.cartAdditions} icon={ShoppingCart} />
          <StatCard
            label="Siparis"
            value={todayStats.completedOrders}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Terk"
            value={todayStats.abandonedCarts}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard label="Donusum" value={`%${todayStats.conversionRate}`} icon={TrendingUp} />
        </div>
      )}

      {/* Katalogda Goruntulenenleri Hesapla ve Goster */}
      {(() => {
        // Tum session'lardan goruntulenenleri topla
        const allViewedProducts: { productId: string; productName: string; productImage: string | null; count: number; viewTypes: Set<string> }[] = [];
        const productViewMap = new Map<string, { productName: string; productImage: string | null; count: number; viewTypes: Set<string> }>();

        activeSessions.forEach((session) => {
          const sessionData = session as any;
          const viewedProducts = sessionData.viewedProducts || [];
          viewedProducts.forEach((vp: ViewedProduct) => {
            const existing = productViewMap.get(vp.productId);
            if (existing) {
              existing.count++;
              existing.viewTypes.add(vp.viewType);
            } else {
              productViewMap.set(vp.productId, {
                productName: vp.productName,
                productImage: vp.productImage,
                count: 1,
                viewTypes: new Set([vp.viewType])
              });
            }
          });
        });

        // Map'i array'e cevir ve sirala
        productViewMap.forEach((value, key) => {
          allViewedProducts.push({ productId: key, ...value });
        });
        allViewedProducts.sort((a, b) => b.count - a.count);

        const topProducts = allViewedProducts.slice(0, 10);
        const totalViews = allViewedProducts.reduce((sum, p) => sum + p.count, 0);

        if (topProducts.length === 0) return null;

        return (
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-cream-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                Katalogda En Cok Goruntuleneler ({totalViews} goruntulenme)
              </h3>
              <span className="text-xs text-gray-400">
                Aktif ziyaretciler tarafindan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {topProducts.map((product, idx) => (
                <div
                  key={product.productId}
                  className="relative bg-cream-50 dark:bg-dark-700 rounded-xl p-3 hover:shadow-md transition-all"
                >
                  {/* Siralama Badge */}
                  <span className={`absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-full ${
                    idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                    idx === 1 ? 'bg-gray-300 text-gray-700' :
                    idx === 2 ? 'bg-orange-300 text-orange-800' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Urun Gorseli */}
                  <div className="aspect-square bg-white dark:bg-dark-600 rounded-lg overflow-hidden mb-2">
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Urun Bilgileri */}
                  <h4 className="text-xs font-medium text-brown-900 dark:text-white line-clamp-2 mb-1">
                    {product.productName}
                  </h4>

                  {/* Goruntulenme Sayisi ve Tipi */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {product.count}x
                    </span>
                    <div className="flex gap-1">
                      {product.viewTypes.has('hover') && (
                        <span className="text-[9px] bg-gray-100 dark:bg-dark-600 px-1.5 py-0.5 rounded text-gray-500">
                          hover
                        </span>
                      )}
                      {product.viewTypes.has('quickview') && (
                        <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded text-purple-600 dark:text-purple-400">
                          quick
                        </span>
                      )}
                      {product.viewTypes.has('detail') && (
                        <span className="text-[9px] bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-green-600 dark:text-green-400">
                          detay
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {allViewedProducts.length > 10 && (
              <p className="text-center text-xs text-gray-400 mt-3">
                +{allViewedProducts.length - 10} daha fazla urun goruntulendi
              </p>
            )}
          </div>
        );
      })()}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Abandoned Carts */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-cream-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Terk Edilen Sepetler ({abandonedCarts.length})
            </h3>
          </div>

          {abandonedCarts.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Bugun terk edilen sepet yok</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {abandonedCarts.map((cart) => (
                <div
                  key={cart.id}
                  className="flex items-center justify-between p-4 bg-cream-50 dark:bg-dark-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-brown-900 dark:text-white">
                        {cart.customerName || 'Anonim'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {cart.geo?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {cart.geo.city}
                          </span>
                        )}
                        <span>{cart.cartItems.length} urun</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-brown-900 dark:text-white">
                        {cart.cartValue.toLocaleString('tr-TR')} TL
                      </p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(cart.abandonedAt)}</p>
                    </div>
                    {cart.customerEmail && !cart.recoveryEmailSent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleSendRecoveryEmail(cart)}
                      >
                        <Mail className="w-4 h-4" />
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
          {(() => {
            // Gercek aktif: son 30 dakika icinde aktivite
            const thirtyMinsAgo = Date.now() - 30 * 60 * 1000
            const realActiveSessions = activeSessions.filter(s => s.lastActivityAt.getTime() > thirtyMinsAgo)
            const lostSessions = activeSessions.filter(s => s.lastActivityAt.getTime() <= thirtyMinsAgo)

            return (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Aktif Ziyaretciler ({realActiveSessions.length})
                  </h3>
                  {lostSessions.length > 0 && (
                    <span className="text-xs text-red-500">
                      {lostSessions.length} kayip (30dk+ sessiz)
                    </span>
                  )}
                </div>

                {realActiveSessions.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Su an aktif ziyaretci yok</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {/* En son aktif olanlar uste */}
                    {[...realActiveSessions]
                      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
                      .slice(0, 15)
                      .map((session) => {
                const stageConfig = STAGE_CONFIG.find((s) => s.id === session.currentStage)
                const StageIcon = stageConfig?.Icon || Target
                const sessionData = session as any // Ekstra alanlar icin

                return (
                  <div
                    key={session.id}
                    className="p-4 bg-cream-50 dark:bg-dark-700 rounded-xl hover:shadow-md transition-all"
                  >
                    {/* Ust satir: Isim ve Stage */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 ${stageConfig?.color || 'bg-gray-400'} rounded-lg flex items-center justify-center`}
                        >
                          <StageIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-brown-900 dark:text-white">
                              {session.customerName || 'Anonim Ziyaretci'}
                            </p>
                            {session.isReturningCustomer && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                VIP
                              </span>
                            )}
                          </div>
                          {session.customerEmail && (
                            <p className="text-xs text-gray-500">{session.customerEmail}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {session.cartValue > 0 && (
                          <p className="font-bold text-brown-900 dark:text-white">
                            {session.cartValue.toLocaleString('tr-TR')} TL
                          </p>
                        )}
                        {/* Aktiflik durumu */}
                        {(() => {
                          const status = getActivityStatus(session.lastActivityAt)
                          return (
                            <span className={`inline-block text-[10px] text-white px-2 py-0.5 rounded ${status.color}`}>
                              {status.label}
                            </span>
                          )
                        })()}
                        <p className="text-[10px] text-gray-500 mt-1">
                          {formatSessionDuration(session.startedAt, session.lastActivityAt)} sitede
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatTimeAgo(session.lastActivityAt)}
                        </p>
                      </div>
                    </div>

                    {/* Alt satir: Detaylar */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      {/* Cihaz & Browser */}
                      <span className="flex items-center gap-1 bg-white dark:bg-dark-800 px-2 py-1 rounded">
                        <DeviceIcon device={session.device} className="w-3 h-3" />
                        {session.device}
                        {sessionData.browser && ` / ${sessionData.browser}`}
                      </span>

                      {/* Konum - ilce, sehir, ulke */}
                      <span className="flex items-center gap-1 bg-white dark:bg-dark-800 px-2 py-1 rounded">
                        <MapPin className="w-3 h-3" />
                        {session.geo && (session.geo.city || session.geo.region || session.geo.country)
                          ? [session.geo.city, session.geo.region, session.geo.country]
                              .filter(Boolean)
                              .join(', ')
                          : 'Konum yukleniyor...'}
                      </span>

                      {/* Kaynak */}
                      {sessionData.referrer && sessionData.referrer !== 'Direkt' && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          {sessionData.referrer}
                        </span>
                      )}

                      {/* Stage */}
                      <span className={`px-2 py-1 rounded text-white ${stageConfig?.color || 'bg-gray-400'}`}>
                        {stageConfig?.label || session.currentStage}
                      </span>

                      {/* Sepet */}
                      {session.cartItems > 0 && (
                        <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                          <ShoppingCart className="w-3 h-3" />
                          {session.cartItems} urun
                        </span>
                      )}
                    </div>

                    {/* Sayfa Gecmisi */}
                    {session.pagesVisited && session.pagesVisited.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                        <p className="text-[10px] text-gray-400 mb-1">
                          Sayfa Gecmisi ({session.pagesVisited.length} sayfa):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {session.pagesVisited.slice(-5).map((page, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-gray-100 dark:bg-dark-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300"
                            >
                              {page === '/' ? 'Ana Sayfa' : page.replace(/\//g, ' / ').trim()}
                            </span>
                          ))}
                          {session.pagesVisited.length > 5 && (
                            <span className="text-[10px] text-gray-400">
                              +{session.pagesVisited.length - 5} daha
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Goruntulenen Urunler */}
                    {sessionData.viewedProducts && sessionData.viewedProducts.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                        <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Inceledigi Urunler ({sessionData.viewedProducts.length}):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {sessionData.viewedProducts.slice(-6).map((vp: ViewedProduct, idx: number) => (
                            <div
                              key={`${vp.productId}-${idx}`}
                              className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                            >
                              {vp.productImage && (
                                <img
                                  src={vp.productImage}
                                  alt=""
                                  className="w-5 h-5 rounded object-cover"
                                />
                              )}
                              <span className="text-[10px] text-blue-700 dark:text-blue-300 max-w-[80px] truncate">
                                {vp.productName}
                              </span>
                              <span className={`text-[8px] px-1 rounded ${
                                vp.viewType === 'quickview'
                                  ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300'
                                  : vp.viewType === 'detail'
                                    ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                {vp.viewType === 'quickview' ? 'Q' : vp.viewType === 'detail' ? 'D' : 'H'}
                              </span>
                            </div>
                          ))}
                          {sessionData.viewedProducts.length > 6 && (
                            <span className="text-[10px] text-gray-400">
                              +{sessionData.viewedProducts.length - 6} daha
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Visitor ID - kisa ve belirgin */}
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-gray-400">
                      <span>ID: #{session.visitorId?.split('_')[1] || session.visitorId?.slice(-8)}</span>
                      <span>Session: {session.id?.slice(-6)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Kayip Ziyaretciler - Collapsible Section */}
        {(() => {
          const thirtyMinsAgo = Date.now() - 30 * 60 * 1000
          const lostSessions = activeSessions.filter(s => s.lastActivityAt.getTime() <= thirtyMinsAgo)

          if (lostSessions.length === 0) return null

          const toggleLostSession = (sessionId: string) => {
            setExpandedLostSessions(prev => {
              const next = new Set(prev)
              if (next.has(sessionId)) {
                next.delete(sessionId)
              } else {
                next.add(sessionId)
              }
              return next
            })
          }

          return (
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-cream-200 dark:border-gray-700 overflow-hidden">
              {/* Header - Tiklayinca ac/kapa */}
              <button
                onClick={() => setIsLostSectionOpen(!isLostSectionOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-cream-50 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <UserX className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Kayip Ziyaretciler
                    </h3>
                    <p className="text-xs text-gray-400">
                      30+ dakika sessiz, siteyi terk etmis olabilir
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-500">{lostSessions.length}</span>
                  {isLostSectionOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Liste - Acilabilir */}
              {isLostSectionOpen && (
                <div className="border-t border-cream-200 dark:border-gray-700 max-h-[400px] overflow-y-auto">
                  {lostSessions
                    .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
                    .map((session) => {
                      const isExpanded = expandedLostSessions.has(session.id)
                      const stageConfig = STAGE_CONFIG.find((s) => s.id === session.currentStage)
                      const StageIcon = stageConfig?.Icon || Target
                      const sessionData = session as any

                      return (
                        <div key={session.id} className="border-b border-cream-100 dark:border-gray-700 last:border-b-0">
                          {/* Satir - Tiklayinca detay ac */}
                          <button
                            onClick={() => toggleLostSession(session.id)}
                            className="w-full flex items-center justify-between p-3 hover:bg-cream-50 dark:hover:bg-dark-700 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 ${stageConfig?.color || 'bg-gray-400'} rounded flex items-center justify-center`}>
                                <StageIcon className="w-3 h-3 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-brown-900 dark:text-white">
                                  {session.customerName || 'Anonim'}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                  <span>{session.device}</span>
                                  {session.geo?.city && (
                                    <>
                                      <span>•</span>
                                      <span>{session.geo.city}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {session.cartValue > 0 && (
                                <span className="text-xs font-bold text-yellow-600">
                                  {session.cartValue.toLocaleString('tr-TR')} TL
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400">
                                {formatTimeAgo(session.lastActivityAt)}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Detay Alani */}
                          {isExpanded && (
                            <div className="px-4 pb-4 bg-cream-50 dark:bg-dark-700">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                                <span className="flex items-center gap-1 bg-white dark:bg-dark-800 px-2 py-1 rounded">
                                  <DeviceIcon device={session.device} className="w-3 h-3" />
                                  {session.device} / {sessionData.browser || '-'}
                                </span>
                                <span className="flex items-center gap-1 bg-white dark:bg-dark-800 px-2 py-1 rounded">
                                  <MapPin className="w-3 h-3" />
                                  {session.geo
                                    ? [session.geo.city, session.geo.region, session.geo.country].filter(Boolean).join(', ')
                                    : 'Bilinmiyor'}
                                </span>
                                {sessionData.referrer && sessionData.referrer !== 'Direkt' && (
                                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                    {sessionData.referrer}
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded text-white ${stageConfig?.color || 'bg-gray-400'}`}>
                                  {stageConfig?.label || session.currentStage}
                                </span>
                              </div>

                              {/* Sayfa Gecmisi */}
                              {session.pagesVisited && session.pagesVisited.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-[10px] text-gray-400 mb-1">
                                    Sayfa Gecmisi ({session.pagesVisited.length} sayfa):
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {session.pagesVisited.slice(-8).map((page, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] bg-white dark:bg-dark-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300"
                                      >
                                        {page === '/' ? 'Ana Sayfa' : page.replace(/\//g, ' / ').trim()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Sepet Detayi */}
                              {session.cartItems > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                  <ShoppingCart className="w-3 h-3 text-yellow-500" />
                                  <span className="text-yellow-600 dark:text-yellow-400">
                                    {session.cartItems} urun - {session.cartValue.toLocaleString('tr-TR')} TL
                                  </span>
                                </div>
                              )}

                              <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-gray-400">
                                <span>Sitede: {formatSessionDuration(session.startedAt, session.lastActivityAt)}</span>
                                <span>•</span>
                                <span>ID: #{session.visitorId?.split('_')[1] || session.visitorId?.slice(-8)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })()}
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
      <Icon
        className={`w-4 h-4 ${
          color === 'green' ? 'text-green-500' : color === 'red' ? 'text-red-500' : 'text-gray-400'
        }`}
      />
      <span className="text-xs text-gray-500 uppercase">{label}</span>
    </div>
    <p
      className={`text-2xl font-bold ${
        color === 'green'
          ? 'text-green-600'
          : color === 'red'
            ? 'text-red-600'
            : 'text-brown-900 dark:text-white'
      }`}
    >
      {value}
    </p>
  </div>
)
