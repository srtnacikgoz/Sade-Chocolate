// src/components/admin/tabs/MetaAdsTab.tsx
// Meta CAPI & Pixel event takip paneli

import React, { useState, useEffect, useRef } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
  doc,
  deleteDoc
} from 'firebase/firestore'
import { db, auth } from '../../../lib/firebase'
import {
  Activity,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Eye,
  ShoppingCart,
  CreditCard,
  Target,
  LayoutGrid,
  Search,
  RefreshCw,
  Filter,
  AlertTriangle,
  ArrowUp,
  Trash2
} from 'lucide-react'

// Event tipi renkleri ve ikonlari
const EVENT_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  ViewContent: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Eye },
  AddToCart: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: ShoppingCart },
  InitiateCheckout: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: CreditCard },
  Purchase: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
}

// Funnel stage konfigurasyonu
const FUNNEL_STAGES = [
  { id: 'landing', label: 'Giris', icon: Target, color: 'bg-gray-400' },
  { id: 'catalog', label: 'Katalog', icon: LayoutGrid, color: 'bg-blue-400' },
  { id: 'product', label: 'Urun', icon: Search, color: 'bg-purple-400' },
  { id: 'cart', label: 'Sepet', icon: ShoppingCart, color: 'bg-yellow-500' },
  { id: 'checkout', label: 'Odeme', icon: CreditCard, color: 'bg-orange-500' },
  { id: 'completed', label: 'Satin Alma', icon: CheckCircle, color: 'bg-green-500' },
]

type MetaEvent = {
  id: string
  eventName: string
  eventId: string
  source: 'capi_browser' | 'capi_trigger'
  status: 'success' | 'failed'
  orderId?: string
  value?: number
  currency: string
  customerEmail?: string
  errorMessage?: string
  metaResponse?: Record<string, unknown>
  createdAt: Date
}

type FunnelData = {
  landing: number
  catalog: number
  product: number
  cart: number
  checkout: number
  completed: number
}

type FilterState = {
  eventName: string
  status: string
}

export const MetaAdsTab: React.FC = () => {
  const [events, setEvents] = useState<MetaEvent[]>([])
  const [todayEvents, setTodayEvents] = useState<MetaEvent[]>([])
  const [funnelData, setFunnelData] = useState<FunnelData>({
    landing: 0, catalog: 0, product: 0, cart: 0, checkout: 0, completed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({ eventName: '', status: '' })
  const [funnelDelta, setFunnelDelta] = useState<FunnelData>({
    landing: 0, catalog: 0, product: 0, cart: 0, checkout: 0, completed: 0,
  })
  const prevFunnelRef = useRef<FunnelData | null>(null)
  const isFirstLoad = useRef(true)
  const deltaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Son 50 event'i dinle (tablo icin)
  useEffect(() => {
    const eventsRef = collection(db, 'meta_events')
    const q = query(eventsRef, orderBy('createdAt', 'desc'), limit(50))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as MetaEvent[]

      setEvents(data)
      setIsLoading(false)
    }, (error) => {
      console.error('meta_events dinlenemedi:', error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Bugunun event'leri (istatistikler icin)
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const eventsRef = collection(db, 'meta_events')
    const q = query(
      eventsRef,
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as MetaEvent[]

      setTodayEvents(data)
    })

    return () => unsubscribe()
  }, [])

  // Bugunun funnel verisini dinle (sessions koleksiyonundan)
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Admin visitor ID — kendi session'larimizi filtrele
    const adminVisitorId = localStorage.getItem('sade_visitor_id')
    const adminEmail = auth.currentUser?.email || null

    const sessionsRef = collection(db, 'sessions')
    const q = query(sessionsRef, where('startedAt', '>=', Timestamp.fromDate(today)))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const funnel: FunnelData = {
        landing: 0, catalog: 0, product: 0, cart: 0, checkout: 0, completed: 0,
      }

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()

        // Admin session'larini atla (visitor ID veya email ile)
        if (adminVisitorId && data.visitorId === adminVisitorId) return
        if (adminEmail && data.customerEmail === adminEmail) return

        const stage = data.currentStage as string

        // Her asama, onceki asamalari da kapsar
        if (stage === 'completed') {
          funnel.landing++; funnel.catalog++; funnel.product++; funnel.cart++; funnel.checkout++; funnel.completed++
        } else if (stage === 'checkout') {
          funnel.landing++; funnel.catalog++; funnel.product++; funnel.cart++; funnel.checkout++
        } else if (stage === 'cart' || stage === 'abandoned') {
          funnel.landing++; funnel.catalog++; funnel.product++; funnel.cart++
        } else if (stage === 'product') {
          funnel.landing++; funnel.catalog++; funnel.product++
        } else if (stage === 'catalog') {
          funnel.landing++; funnel.catalog++
        } else {
          funnel.landing++
        }
      })

      // Delta hesapla (ilk yukleme disinda)
      if (isFirstLoad.current) {
        isFirstLoad.current = false
      } else if (prevFunnelRef.current) {
        const prev = prevFunnelRef.current
        const newDelta: FunnelData = {
          landing: funnel.landing - prev.landing,
          catalog: funnel.catalog - prev.catalog,
          product: funnel.product - prev.product,
          cart: funnel.cart - prev.cart,
          checkout: funnel.checkout - prev.checkout,
          completed: funnel.completed - prev.completed,
        }

        // Herhangi bir degisim varsa deltayi goster ve 15sn tut
        const hasChange = Object.values(newDelta).some((v) => v !== 0)
        if (hasChange) {
          setFunnelDelta(newDelta)

          // Onceki timer'i temizle
          if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current)

          // 15 saniye sonra deltayi sifirla
          deltaTimerRef.current = setTimeout(() => {
            setFunnelDelta({
              landing: 0, catalog: 0, product: 0, cart: 0, checkout: 0, completed: 0,
            })
          }, 15000)
        }
      }
      prevFunnelRef.current = { ...funnel }

      setFunnelData(funnel)
    })

    return () => {
      unsubscribe()
      if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current)
    }
  }, [])

  // Istatistik hesaplamalari
  const totalToday = todayEvents.length
  const successToday = todayEvents.filter((e) => e.status === 'success').length
  const failedToday = todayEvents.filter((e) => e.status === 'failed').length
  const purchaseToday = todayEvents.filter((e) => e.eventName === 'Purchase' && e.status === 'success').length
  const totalRevenue = todayEvents
    .filter((e) => e.eventName === 'Purchase' && e.status === 'success')
    .reduce((sum, e) => sum + (e.value || 0), 0)

  // Son basarili event zamani
  const lastSuccessEvent = events.find((e) => e.status === 'success')
  const successRate = totalToday > 0 ? Math.round((successToday / totalToday) * 100) : 0

  // Filtrelenmis event listesi
  const filteredEvents = events.filter((e) => {
    if (filters.eventName && e.eventName !== filters.eventName) return false
    if (filters.status && e.status !== filters.status) return false
    return true
  })

  // Event silme
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'meta_events', eventId))
    } catch (error) {
      console.error('Event silinemedi:', error)
    }
  }

  const handleDeleteAllEvents = async () => {
    if (!confirm(`${filteredEvents.length} event silinecek. Emin misiniz?`)) return
    try {
      await Promise.all(filteredEvents.map((e) => deleteDoc(doc(db, 'meta_events', e.id))))
    } catch (error) {
      console.error('Event\'ler silinemedi:', error)
    }
  }

  // Zaman formatlama
  const formatTime = (date: Date): string => {
    return date.toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Az once'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} dk once`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat once`
    return `${Math.floor(hours / 24)} gun once`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-mustard" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* A) Konfigürasyon Durumu */}
      <div className="bg-white rounded-2xl p-5 border border-cream-200">
        <h3 className="text-sm font-semibold text-mocha-500 uppercase tracking-wider mb-4">
          Meta CAPI Durumu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pixel ID */}
          <div className="flex items-center gap-3 bg-cream-50 rounded-xl p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-mocha-400">Pixel ID</p>
              <p className="text-sm font-mono font-medium text-mocha-700">
                Yapilandirildi
              </p>
            </div>
          </div>

          {/* CAPI Basari Orani */}
          <div className="flex items-center gap-3 bg-cream-50 rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              successRate >= 90 ? 'bg-green-100' : successRate >= 70 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {successRate >= 90 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : successRate >= 70 ? (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-mocha-400">CAPI Basari (24s)</p>
              <p className={`text-sm font-bold ${
                successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                %{successRate}
                <span className="text-xs font-normal text-mocha-400 ml-1">
                  ({successToday}/{totalToday})
                </span>
              </p>
            </div>
          </div>

          {/* Son Event */}
          <div className="flex items-center gap-3 bg-cream-50 rounded-xl p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-mocha-400">Son Basarili Event</p>
              <p className="text-sm font-medium text-mocha-700">
                {lastSuccessEvent
                  ? formatTimeAgo(lastSuccessEvent.createdAt)
                  : 'Henuz event yok'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* B) Gunluk Istatistikler — KPI Kartlari */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Toplam Event"
          value={totalToday}
          icon={Activity}
          subtitle="Bugun"
        />
        <KPICard
          label="Basarili"
          value={successToday}
          icon={CheckCircle}
          color="green"
          subtitle={failedToday > 0 ? `${failedToday} basarisiz` : 'Hata yok'}
        />
        <KPICard
          label="Purchase"
          value={purchaseToday}
          icon={ShoppingCart}
          color="blue"
          subtitle="Satin alma event'i"
        />
        <KPICard
          label="Donusum Degeri"
          value={`${totalRevenue.toLocaleString('tr-TR')} TL`}
          icon={DollarSign}
          color="gold"
          subtitle="Toplam gelir"
        />
      </div>

      {/* D) Donusum Hunisi */}
      <div className="bg-white rounded-2xl p-6 border border-cream-200">
        <h3 className="text-sm font-semibold text-mocha-500 uppercase tracking-wider mb-6">
          Donusum Hunisi (Bugun)
        </h3>
        <div className="flex items-end justify-between gap-2">
          {FUNNEL_STAGES.map((stage, idx) => {
            const count = funnelData[stage.id as keyof FunnelData] || 0
            const maxCount = Math.max(...(Object.values(funnelData) as number[]), 1)
            const height = Math.max((count / maxCount) * 120, 20)
            const Icon = stage.icon

            // Onceki asamadan drop-off
            const prevStage = idx > 0 ? FUNNEL_STAGES[idx - 1] : null
            const prevCount = prevStage ? funnelData[prevStage.id as keyof FunnelData] || 0 : 0
            const dropOff = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0

            const delta = funnelDelta[stage.id as keyof FunnelData] || 0

            return (
              <div key={stage.id} className="flex-1 flex flex-col items-center gap-2 relative">
                {idx > 0 && prevCount > 0 && (
                  <div className="absolute -left-1 top-8 text-xs text-center">
                    <span className="text-red-500">-{dropOff}%</span>
                  </div>
                )}

                <span className="text-2xl font-bold text-mocha-900">{count}</span>

                {/* Delta gostergesi — degisim oldugunda */}
                {delta > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full animate-pulse">
                    <ArrowUp className="w-3 h-3" />
                    +{delta}
                  </span>
                )}

                <div
                  className={`w-full ${stage.color} rounded-t-lg transition-all duration-500`}
                  style={{ height: `${height}px` }}
                />
                <div className="flex flex-col items-center gap-1">
                  <Icon className="w-5 h-5 text-mocha-400" />
                  <span className="text-xs text-mocha-500 text-center">{stage.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ozet Metrikleri */}
        {funnelData.landing > 0 && (
          <div className="mt-4 pt-4 border-t border-cream-200 flex justify-center gap-6 text-xs">
            <div className="text-center">
              <p className="text-mocha-400">Sepet Orani</p>
              <p className="font-bold text-yellow-600">
                {Math.round((funnelData.cart / funnelData.landing) * 100)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-mocha-400">Checkout Orani</p>
              <p className="font-bold text-orange-600">
                {Math.round((funnelData.checkout / funnelData.landing) * 100)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-mocha-400">Toplam Donusum</p>
              <p className="font-bold text-green-600">
                {Math.round((funnelData.completed / funnelData.landing) * 100)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* C) Son Event'ler Tablosu */}
      <div className="bg-white rounded-2xl border border-cream-200">
        <div className="p-5 border-b border-cream-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-mocha-500 uppercase tracking-wider">
              Son Event'ler ({filteredEvents.length})
            </h3>

            {/* Filtreler + Temizle */}
            <div className="flex items-center gap-2">
              {filteredEvents.length > 0 && (
                <button
                  onClick={handleDeleteAllEvents}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Temizle
                </button>
              )}
              <Filter className="w-4 h-4 text-mocha-400" />
              <select
                value={filters.eventName}
                onChange={(e) => setFilters((f) => ({ ...f, eventName: e.target.value }))}
                className="text-xs border border-cream-200 rounded-lg px-2 py-1.5 bg-white text-mocha-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="">Tum Event'ler</option>
                <option value="ViewContent">ViewContent</option>
                <option value="AddToCart">AddToCart</option>
                <option value="InitiateCheckout">InitiateCheckout</option>
                <option value="Purchase">Purchase</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="text-xs border border-cream-200 rounded-lg px-2 py-1.5 bg-white text-mocha-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="">Tum Durumlar</option>
                <option value="success">Basarili</option>
                <option value="failed">Basarisiz</option>
              </select>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-mocha-400">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Henuz CAPI event'i yok</p>
            <p className="text-xs mt-1">Event'ler site ziyaretleriyle olusacak</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-mocha-400 uppercase tracking-wider border-b border-cream-200">
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Kaynak</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3">Tutar</th>
                  <th className="px-5 py-3">Siparis</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const config = EVENT_CONFIG[event.eventName] || {
                    color: 'text-mocha-600',
                    bgColor: 'bg-cream-100',
                    icon: Activity,
                  }
                  const EventIcon = config.icon

                  return (
                    <tr
                      key={event.id}
                      className={`border-b border-cream-100 hover:bg-cream-50 transition-colors ${
                        event.status === 'failed' ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span className="text-mocha-700">{formatTime(event.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                            <EventIcon className={`w-3.5 h-3.5 ${config.color}`} />
                          </div>
                          <span className={`font-medium ${config.color}`}>
                            {event.eventName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                          event.source === 'capi_trigger'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {event.source === 'capi_trigger' ? 'Trigger' : 'Browser'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {event.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Basarili
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                              <XCircle className="w-3 h-3" />
                              Basarisiz
                            </span>
                            {event.errorMessage && (
                              <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={event.errorMessage}>
                                {event.errorMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {event.value ? (
                          <span className="font-medium text-mocha-900">
                            {event.value.toLocaleString('tr-TR')} TL
                          </span>
                        ) : (
                          <span className="text-mocha-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {event.orderId ? (
                          <span className="text-xs font-mono bg-cream-100 px-2 py-1 rounded text-mocha-600">
                            {event.orderId}
                          </span>
                        ) : (
                          <span className="text-mocha-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1.5 rounded-lg text-mocha-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// KPI Kart Componenti
const KPICard: React.FC<{
  label: string
  value: string | number
  icon: React.ElementType
  color?: 'green' | 'blue' | 'gold' | 'red'
  subtitle?: string
}> = ({ label, value, icon: Icon, color, subtitle }) => {
  const colorMap = {
    green: { iconBg: 'bg-green-100', iconText: 'text-green-600', valueText: 'text-green-600' },
    blue: { iconBg: 'bg-blue-100', iconText: 'text-blue-600', valueText: 'text-blue-600' },
    gold: { iconBg: 'bg-yellow-100', iconText: 'text-yellow-600', valueText: 'text-yellow-600' },
    red: { iconBg: 'bg-red-100', iconText: 'text-red-600', valueText: 'text-red-600' },
  }
  const c = color ? colorMap[color] : {
    iconBg: 'bg-cream-100', iconText: 'text-mocha-500', valueText: 'text-mocha-900',
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-cream-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.iconText}`} />
        </div>
        <span className="text-xs text-mocha-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${c.valueText}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-mocha-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
