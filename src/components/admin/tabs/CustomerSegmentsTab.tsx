// src/components/admin/tabs/CustomerSegmentsTab.tsx
// RFM Müşteri Segmentasyonu + CLV Analizi - Admin Panel Tab
// SaaS-Dostu: Config-driven, real-time updates

import React, { useState, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../lib/firebase'
import {
  getRFMConfig,
  getRFMDashboardData,
  getCustomersBySegment,
  getSegmentColorClass,
  getCLVConfig,
  getCLVDashboardData,
  getTopCLVCustomers,
  getCLVTierColorClass
} from '../../../services/rfmService'
import {
  RFMConfig,
  RFMDashboardData,
  CustomerRFM,
  CustomerSegmentId,
  SegmentDefinition,
  CLVConfig,
  CLVDashboardData,
  CustomerCLV
} from '../../../types/rfm'
import { toast } from 'sonner'
import {
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronRight,
  Mail,
  Clock,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Crown,
  Heart,
  Sparkles,
  UserPlus,
  UserMinus,
  Moon,
  Gem,
  Award,
  Target,
  BarChart3
} from 'lucide-react'

// Segment ikonları
const SEGMENT_ICONS: Record<CustomerSegmentId, React.ElementType> = {
  champions: Crown,
  loyal: Heart,
  potential: Sparkles,
  new: UserPlus,
  at_risk: AlertTriangle,
  hibernating: Moon,
  lost: UserMinus
}

// Segment renkleri (Tailwind)
const SEGMENT_COLORS: Record<CustomerSegmentId, { bg: string; text: string; border: string }> = {
  champions: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  loyal: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  potential: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  new: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  at_risk: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  hibernating: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  lost: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
}

// Tab tipi
type TabType = 'rfm' | 'clv'

// CLV Tier ikonları
const CLV_TIER_ICONS: Record<string, React.ElementType> = {
  platinum: Gem,
  gold: Crown,
  silver: Award,
  bronze: Target
}

// CLV Tier renkleri
const CLV_TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  platinum: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  gold: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  silver: { bg: 'bg-slate-200', text: 'text-slate-700', border: 'border-slate-400' },
  bronze: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' }
}

export function CustomerSegmentsTab() {
  const [activeTab, setActiveTab] = useState<TabType>('rfm')
  const [config, setConfig] = useState<RFMConfig | null>(null)
  const [dashboard, setDashboard] = useState<RFMDashboardData | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegmentId | null>(null)
  const [segmentCustomers, setSegmentCustomers] = useState<CustomerRFM[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

  // CLV State
  const [clvConfig, setClvConfig] = useState<CLVConfig | null>(null)
  const [clvDashboard, setClvDashboard] = useState<CLVDashboardData | null>(null)
  const [topCLVCustomers, setTopCLVCustomers] = useState<CustomerCLV[]>([])
  const [isCalculatingCLV, setIsCalculatingCLV] = useState(false)

  // Verileri yükle
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [configData, dashboardData, clvConfigData, clvDashboardData, topCustomers] = await Promise.all([
        getRFMConfig(),
        getRFMDashboardData(),
        getCLVConfig(),
        getCLVDashboardData(),
        getTopCLVCustomers(20)
      ])
      setConfig(configData)
      setDashboard(dashboardData)
      setClvConfig(clvConfigData)
      setClvDashboard(clvDashboardData)
      setTopCLVCustomers(topCustomers)
    } catch (error) {
      console.error('Veriler yüklenemedi:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Segment seçildiğinde müşterileri yükle
  const handleSegmentClick = async (segmentId: CustomerSegmentId) => {
    if (selectedSegment === segmentId) {
      setSelectedSegment(null)
      setSegmentCustomers([])
      return
    }

    setSelectedSegment(segmentId)
    setIsLoadingCustomers(true)

    try {
      const customers = await getCustomersBySegment(segmentId, 50)
      setSegmentCustomers(customers)
    } catch (error) {
      console.error('Segment müşterileri yüklenemedi:', error)
      toast.error('Müşteriler yüklenirken hata oluştu')
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  // Manuel RFM hesaplama
  const handleCalculateRFM = async () => {
    setIsCalculating(true)
    try {
      const triggerRFM = httpsCallable(functions, 'triggerRFMCalculation')
      const result = await triggerRFM({})
      const data = result.data as { success: boolean; processedCount: number }

      if (data.success) {
        toast.success(`RFM hesaplandı: ${data.processedCount} müşteri`)
        await loadData() // Verileri yenile
      }
    } catch (error: any) {
      console.error('RFM hesaplama hatası:', error)
      toast.error(error.message || 'RFM hesaplanamadı')
    } finally {
      setIsCalculating(false)
    }
  }

  // Manuel CLV hesaplama
  const handleCalculateCLV = async () => {
    setIsCalculatingCLV(true)
    try {
      const triggerCLV = httpsCallable(functions, 'triggerCLVCalculation')
      const result = await triggerCLV({})
      const data = result.data as { success: boolean; processedCount: number }

      if (data.success) {
        toast.success(`CLV hesaplandı: ${data.processedCount} müşteri`)
        await loadData() // Verileri yenile
      }
    } catch (error: any) {
      console.error('CLV hesaplama hatası:', error)
      toast.error(error.message || 'CLV hesaplanamadı')
    } finally {
      setIsCalculatingCLV(false)
    }
  }

  // Segment kartı
  const SegmentCard = ({ segment, stats }: {
    segment: SegmentDefinition
    stats: { customerCount: number; totalRevenue: number; percentageOfTotal: number } | undefined
  }) => {
    const Icon = SEGMENT_ICONS[segment.id]
    const colors = SEGMENT_COLORS[segment.id]
    const isSelected = selectedSegment === segment.id
    const count = stats?.customerCount || 0
    const revenue = stats?.totalRevenue || 0
    const percentage = stats?.percentageOfTotal || 0

    return (
      <button
        onClick={() => handleSegmentClick(segment.id)}
        className={`
          relative p-5 rounded-2xl border-2 transition-all text-left w-full
          ${isSelected
            ? `${colors.bg} ${colors.border} shadow-lg scale-[1.02]`
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
            <Icon size={20} />
          </div>
          <ChevronRight
            size={18}
            className={`text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`}
          />
        </div>

        {/* Segment adı */}
        <h3 className={`text-sm font-bold ${isSelected ? colors.text : 'text-slate-800'}`}>
          {segment.name.tr}
        </h3>

        {/* İstatistikler */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-slate-900">{count}</span>
            <span className="text-xs text-slate-500 ml-1">müşteri</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">%{percentage.toFixed(1)}</span>
          </div>
        </div>

        {/* Toplam gelir */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">Toplam: </span>
          <span className="text-sm font-semibold text-slate-700">
            {revenue.toLocaleString('tr-TR')} ₺
          </span>
        </div>
      </button>
    )
  }

  // Müşteri satırı
  const CustomerRow = ({ customer }: { customer: CustomerRFM }) => {
    const colors = SEGMENT_COLORS[customer.segmentId]

    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center font-bold text-sm`}>
          {(customer.customerName || customer.customerEmail || '?').charAt(0).toUpperCase()}
        </div>

        {/* Bilgiler */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">
            {customer.customerName || 'İsimsiz'}
          </p>
          <p className="text-xs text-slate-500 truncate">{customer.customerEmail}</p>
        </div>

        {/* RFM Skorları */}
        <div className="flex items-center gap-2">
          <div className="text-center px-2">
            <div className="text-xs text-slate-500">R</div>
            <div className={`text-sm font-bold ${customer.recencyScore >= 4 ? 'text-emerald-600' : customer.recencyScore <= 2 ? 'text-red-600' : 'text-amber-600'}`}>
              {customer.recencyScore}
            </div>
          </div>
          <div className="text-center px-2">
            <div className="text-xs text-slate-500">F</div>
            <div className={`text-sm font-bold ${customer.frequencyScore >= 4 ? 'text-emerald-600' : customer.frequencyScore <= 2 ? 'text-red-600' : 'text-amber-600'}`}>
              {customer.frequencyScore}
            </div>
          </div>
          <div className="text-center px-2">
            <div className="text-xs text-slate-500">M</div>
            <div className={`text-sm font-bold ${customer.monetaryScore >= 4 ? 'text-emerald-600' : customer.monetaryScore <= 2 ? 'text-red-600' : 'text-amber-600'}`}>
              {customer.monetaryScore}
            </div>
          </div>
        </div>

        {/* Detaylar */}
        <div className="hidden md:flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-slate-400" />
            <span>{customer.recencyDays} gün</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingBag size={14} className="text-slate-400" />
            <span>{customer.frequency} sipariş</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign size={14} className="text-slate-400" />
            <span>{customer.monetary.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  // CLV müşteri satırı
  const CLVCustomerRow = ({ customer, rank }: { customer: CustomerCLV; rank: number }) => {
    const tierColors = CLV_TIER_COLORS[customer.tierId] || CLV_TIER_COLORS.bronze
    const TierIcon = CLV_TIER_ICONS[customer.tierId] || Target

    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all">
        {/* Sıra */}
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
          {rank}
        </div>

        {/* Avatar ve Tier */}
        <div className={`w-10 h-10 rounded-full ${tierColors.bg} ${tierColors.text} flex items-center justify-center`}>
          <TierIcon size={18} />
        </div>

        {/* Bilgiler */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">
            {customer.customerEmail}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierColors.bg} ${tierColors.text}`}>
              {customer.tierName}
            </span>
            {customer.clvTrend === 'increasing' && (
              <span className="flex items-center text-xs text-emerald-600">
                <TrendingUp size={12} className="mr-0.5" /> Artıyor
              </span>
            )}
            {customer.clvTrend === 'decreasing' && (
              <span className="flex items-center text-xs text-red-600">
                <TrendingDown size={12} className="mr-0.5" /> Azalıyor
              </span>
            )}
          </div>
        </div>

        {/* CLV Değerleri */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-xs text-slate-500">Toplam Harcama</div>
            <div className="font-semibold text-slate-700">
              {customer.totalRevenue.toLocaleString('tr-TR')} ₺
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500">Sipariş</div>
            <div className="font-semibold text-slate-700">{customer.totalOrders}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500">Ort. Sepet</div>
            <div className="font-semibold text-slate-700">
              {customer.avgOrderValue.toLocaleString('tr-TR')} ₺
            </div>
          </div>
        </div>

        {/* Toplam CLV */}
        <div className="text-right">
          <div className="text-xs text-slate-500">Toplam CLV</div>
          <div className="text-lg font-bold text-emerald-600">
            {customer.totalCLV.toLocaleString('tr-TR')} ₺
          </div>
        </div>
      </div>
    )
  }

  if (!config?.enabled && !clvConfig?.enabled) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Müşteri Zekası Devre Dışı</h2>
        <p className="text-slate-500">RFM ve CLV sistemleri şu an aktif değil. Ayarlardan etkinleştirebilirsiniz.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Müşteri Zekası</h1>
          <p className="text-sm text-slate-500 mt-1">
            RFM segmentasyonu ve CLV analizi ile müşterilerinizi tanıyın
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('rfm')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rfm'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} className="inline mr-1.5" />
            RFM Segmentleri
          </button>
          <button
            onClick={() => setActiveTab('clv')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'clv'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={16} className="inline mr-1.5" />
            CLV Analizi
          </button>
        </div>
      </div>

      {/* Tab İçeriği */}
      {activeTab === 'rfm' ? (
        // RFM Tab İçeriği
        <>
          {/* RFM Header Actions */}
          <div className="flex items-center justify-end gap-3">
            {config?.lastCalculatedAt && (
              <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                Son: {new Date(config.lastCalculatedAt).toLocaleDateString('tr-TR')}
              </div>
            )}
            <button
              onClick={handleCalculateRFM}
              disabled={isCalculating}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400 transition-all"
            >
              <RefreshCw size={16} className={isCalculating ? 'animate-spin' : ''} />
              {isCalculating ? 'Hesaplanıyor...' : 'Yeniden Hesapla'}
            </button>
          </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Users size={14} />
            Toplam Müşteri
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {dashboard?.totalCustomers || 0}
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
            <Crown size={14} />
            Şampiyonlar
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {dashboard?.segmentStats?.find(s => s.segmentId === 'champions')?.customerCount || 0}
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
            <AlertTriangle size={14} />
            Risk Altında
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {dashboard?.segmentStats?.find(s => s.segmentId === 'at_risk')?.customerCount || 0}
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center gap-2 text-red-600 text-xs mb-1">
            <UserMinus size={14} />
            Kaybedilmiş
          </div>
          <div className="text-2xl font-bold text-red-700">
            {dashboard?.segmentStats?.find(s => s.segmentId === 'lost')?.customerCount || 0}
          </div>
        </div>
      </div>

      {/* Segment Kartları */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Tüm Segmentler</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {config?.segments
            .sort((a, b) => a.priority - b.priority)
            .map(segment => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                stats={dashboard?.segmentStats?.find(s => s.segmentId === segment.id)}
              />
            ))}
        </div>
      </div>

      {/* Seçili Segment Müşterileri */}
      {selectedSegment && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {config?.segments.find(s => s.id === selectedSegment)?.name.tr} Müşterileri
            </h2>
            <span className="text-sm text-slate-500">
              {segmentCustomers.length} müşteri gösteriliyor
            </span>
          </div>

          {isLoadingCustomers ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
          ) : segmentCustomers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Bu segmentte müşteri bulunamadı
            </div>
          ) : (
            <div className="space-y-2">
              {segmentCustomers.map(customer => (
                <CustomerRow key={customer.customerId} customer={customer} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Son Segment Geçişleri */}
          {dashboard?.recentTransitions && dashboard.recentTransitions.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Son Segment Değişiklikleri
                <span className="text-sm font-normal text-slate-500 ml-2">(son 30 gün)</span>
              </h2>

              <div className="space-y-2">
                {dashboard.recentTransitions.slice(0, 10).map((transition, idx) => {
                  const fromColors = SEGMENT_COLORS[transition.fromSegment]
                  const toColors = SEGMENT_COLORS[transition.toSegment]
                  const isDowngrade = ['at_risk', 'hibernating', 'lost'].includes(transition.toSegment)

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-4 p-3 rounded-xl ${isDowngrade ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {transition.customerEmail}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${fromColors.bg} ${fromColors.text}`}>
                          {config?.segments.find(s => s.id === transition.fromSegment)?.name.tr}
                        </span>
                        {isDowngrade ? (
                          <TrendingDown size={16} className="text-red-500" />
                        ) : (
                          <TrendingUp size={16} className="text-emerald-500" />
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${toColors.bg} ${toColors.text}`}>
                          {config?.segments.find(s => s.id === transition.toSegment)?.name.tr}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        {new Date(transition.changedAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        // CLV Tab İçeriği
        <>
          {/* CLV Header Actions */}
          <div className="flex items-center justify-end gap-3">
            {clvConfig?.lastCalculatedAt && (
              <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                Son: {new Date(clvConfig.lastCalculatedAt).toLocaleDateString('tr-TR')}
              </div>
            )}
            <button
              onClick={handleCalculateCLV}
              disabled={isCalculatingCLV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:bg-emerald-300 transition-all"
            >
              <RefreshCw size={16} className={isCalculatingCLV ? 'animate-spin' : ''} />
              {isCalculatingCLV ? 'Hesaplanıyor...' : 'CLV Hesapla'}
            </button>
          </div>

          {/* CLV Özet Kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <DollarSign size={14} />
                Ortalama CLV
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {clvDashboard?.averageCLV?.toLocaleString('tr-TR') || 0} ₺
              </div>
            </div>

            <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
              <div className="flex items-center gap-2 text-violet-600 text-xs mb-1">
                <Gem size={14} />
                Platinum
              </div>
              <div className="text-2xl font-bold text-violet-700">
                {clvDashboard?.tierDistribution?.find(t => t.tierId === 'platinum')?.customerCount || 0}
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
                <Crown size={14} />
                Gold
              </div>
              <div className="text-2xl font-bold text-amber-700">
                {clvDashboard?.tierDistribution?.find(t => t.tierId === 'gold')?.customerCount || 0}
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
                <TrendingUp size={14} />
                Toplam CLV
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {clvDashboard?.totalCLV?.toLocaleString('tr-TR') || 0} ₺
              </div>
            </div>
          </div>

          {/* CLV Tier Dağılımı */}
          {clvDashboard?.tierDistribution && clvDashboard.tierDistribution.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Tier Dağılımı</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {clvDashboard.tierDistribution.map(tier => {
                  const tierColors = CLV_TIER_COLORS[tier.tierId] || CLV_TIER_COLORS.bronze
                  const TierIcon = CLV_TIER_ICONS[tier.tierId] || Target

                  return (
                    <div
                      key={tier.tierId}
                      className={`p-5 rounded-2xl border-2 ${tierColors.bg} ${tierColors.border}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-white/50 ${tierColors.text} flex items-center justify-center`}>
                          <TierIcon size={20} />
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold ${tierColors.text}`}>{tier.tierName}</h3>
                          <span className="text-xs text-slate-600">%{tier.percentageOfTotal.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-bold text-slate-900">{tier.customerCount}</span>
                          <span className="text-xs text-slate-500 ml-1">müşteri</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/30">
                        <span className="text-xs text-slate-600">Toplam CLV: </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {tier.totalCLV.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top CLV Müşterileri */}
          {topCLVCustomers.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                En Değerli Müşteriler
                <span className="text-sm font-normal text-slate-500 ml-2">(Top 20)</span>
              </h2>

              <div className="space-y-2">
                {topCLVCustomers.map((customer, idx) => (
                  <CLVCustomerRow key={customer.customerId} customer={customer} rank={idx + 1} />
                ))}
              </div>
            </div>
          )}

          {/* CLV Trend Özeti */}
          {clvDashboard && (
            <div className="mt-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">CLV Trend Özeti</h2>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 mb-2">
                    <TrendingUp size={20} />
                    <span className="font-medium">Artıyor</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-700">
                    {clvDashboard.trendSummary?.increasing || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">müşteri</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                    <span className="w-5 h-0.5 bg-slate-400"></span>
                    <span className="font-medium">Stabil</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-700">
                    {clvDashboard.trendSummary?.stable || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">müşteri</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                    <TrendingDown size={20} />
                    <span className="font-medium">Azalıyor</span>
                  </div>
                  <div className="text-3xl font-bold text-red-700">
                    {clvDashboard.trendSummary?.decreasing || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">müşteri</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CustomerSegmentsTab
