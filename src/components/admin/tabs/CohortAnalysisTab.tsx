// src/components/admin/tabs/CohortAnalysisTab.tsx
// Cohort Analizi - Admin Panel Tab
// SaaS-Dostu: Config-driven, visual heatmap

import React, { useState, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../lib/firebase'
import {
  getCohortConfig,
  getCohortDashboardData,
  getRetentionColor
} from '../../../services/rfmService'
import {
  CohortConfig,
  CohortDashboardData
} from '../../../types/rfm'
import { toast } from 'sonner'
import {
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  DollarSign,
  Percent,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Minus
} from 'lucide-react'

// Metric tipi
type MetricView = 'retention' | 'revenue'

export function CohortAnalysisTab() {
  const [config, setConfig] = useState<CohortConfig | null>(null)
  const [dashboard, setDashboard] = useState<CohortDashboardData | null>(null)
  const [metricView, setMetricView] = useState<MetricView>('retention')
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)

  // Verileri yükle
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [configData, dashboardData] = await Promise.all([
        getCohortConfig(),
        getCohortDashboardData()
      ])
      setConfig(configData)
      setDashboard(dashboardData)
    } catch (error) {
      console.error('Cohort verileri yüklenemedi:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Manuel cohort hesaplama
  const handleCalculateCohort = async () => {
    setIsCalculating(true)
    try {
      const triggerCohort = httpsCallable(functions, 'triggerCohortAnalysis')
      const result = await triggerCohort({})
      const data = result.data as { success: boolean; processedCount: number }

      if (data.success) {
        toast.success(`Cohort analizi tamamlandı: ${data.processedCount} cohort`)
        await loadData()
      }
    } catch (error: any) {
      console.error('Cohort hesaplama hatası:', error)
      toast.error(error.message || 'Cohort analizi hesaplanamadı')
    } finally {
      setIsCalculating(false)
    }
  }

  // Trend ikonu
  const TrendIcon = ({ trend }: { trend: 'improving' | 'stable' | 'declining' }) => {
    if (trend === 'improving') return <TrendingUp size={16} className="text-emerald-500" />
    if (trend === 'declining') return <TrendingDown size={16} className="text-red-500" />
    return <Minus size={16} className="text-slate-400" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  if (!config?.enabled) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Cohort Analizi Devre Dışı</h2>
        <p className="text-slate-500">Bu özellik şu an aktif değil. Ayarlardan etkinleştirebilirsiniz.</p>
      </div>
    )
  }

  const thresholds = config.heatmapThresholds

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cohort Analizi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Müşteri gruplarının zaman içindeki davranışını analiz edin
          </p>
        </div>

        <div className="flex items-center gap-3">
          {config?.lastCalculatedAt && (
            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              Son: {new Date(config.lastCalculatedAt).toLocaleDateString('tr-TR')}
            </div>
          )}

          <button
            onClick={handleCalculateCohort}
            disabled={isCalculating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:bg-violet-300 transition-all"
          >
            <RefreshCw size={16} className={isCalculating ? 'animate-spin' : ''} />
            {isCalculating ? 'Hesaplanıyor...' : 'Analiz Et'}
          </button>
        </div>
      </div>

      {/* Özet Kartları */}
      {dashboard?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar size={14} />
              1. Ay Retention
            </div>
            <div className="text-2xl font-bold text-slate-900">
              %{dashboard.summary.avgFirstMonthRetention}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar size={14} />
              3. Ay Retention
            </div>
            <div className="text-2xl font-bold text-slate-900">
              %{dashboard.summary.avgThirdMonthRetention}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar size={14} />
              6. Ay Retention
            </div>
            <div className="text-2xl font-bold text-slate-900">
              %{dashboard.summary.avgSixthMonthRetention}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <BarChart3 size={14} />
              Genel Trend
            </div>
            <div className="flex items-center gap-2">
              <TrendIcon trend={dashboard.summary.overallTrend} />
              <span className="text-lg font-bold text-slate-900 capitalize">
                {dashboard.summary.overallTrend === 'improving' ? 'İyileşiyor' :
                  dashboard.summary.overallTrend === 'declining' ? 'Düşüyor' : 'Stabil'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Metric Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Cohort Matrisi</h2>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMetricView('retention')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              metricView === 'retention'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent size={14} className="inline mr-1.5" />
            Retention
          </button>
          <button
            onClick={() => setMetricView('revenue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              metricView === 'revenue'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign size={14} className="inline mr-1.5" />
            Gelir
          </button>
        </div>
      </div>

      {/* Heatmap Matrisi */}
      {dashboard && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4 min-w-[120px]">
                  Cohort
                </th>
                <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2 min-w-[60px]">
                  Müşteri
                </th>
                {[0, 1, 2, 3, 4, 5, 6].map(period => (
                  <th key={period} className="text-center text-xs font-medium text-slate-500 pb-3 px-2 min-w-[70px]">
                    Ay {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(metricView === 'retention' ? dashboard.retentionMatrix : dashboard.revenueMatrix)?.map((row, idx) => (
                <tr key={row.cohortId} className={idx % 2 === 0 ? 'bg-slate-50/50' : ''}>
                  <td className="py-2 pr-4">
                    <span className="text-sm font-medium text-slate-700">{row.cohortLabel}</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-sm text-slate-600">
                      {dashboard.cohorts?.find(c => c.cohortId === row.cohortId)?.initialCustomers || '-'}
                    </span>
                  </td>
                  {row.values.map((value, periodIdx) => {
                    if (value === null) {
                      return (
                        <td key={periodIdx} className="py-2 px-2">
                          <div className="w-full h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <span className="text-xs text-slate-400">-</span>
                          </div>
                        </td>
                      )
                    }

                    if (metricView === 'retention') {
                      const colors = getRetentionColor(value, thresholds)
                      return (
                        <td key={periodIdx} className="py-2 px-2">
                          <div className={`w-full h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                            <span className={`text-sm font-semibold ${colors.text}`}>
                              {value}%
                            </span>
                          </div>
                        </td>
                      )
                    } else {
                      // Gelir görünümü
                      const maxRevenue = Math.max(...row.values.filter((v): v is number => v !== null))
                      const intensity = maxRevenue > 0 ? value / maxRevenue : 0
                      const bgClass = intensity > 0.7 ? 'bg-emerald-500' :
                        intensity > 0.4 ? 'bg-emerald-300' :
                        intensity > 0.2 ? 'bg-emerald-200' : 'bg-emerald-100'
                      const textClass = intensity > 0.5 ? 'text-white' : 'text-emerald-900'

                      return (
                        <td key={periodIdx} className="py-2 px-2">
                          <div className={`w-full h-10 rounded-lg ${bgClass} flex items-center justify-center`}>
                            <span className={`text-xs font-semibold ${textClass}`}>
                              {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value} ₺
                            </span>
                          </div>
                        </td>
                      )
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Renk Skalası Açıklaması */}
      {metricView === 'retention' && (
        <div className="flex items-center justify-center gap-6 py-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">Retention Skalası:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-400"></div>
            <span className="text-xs text-slate-600">&lt;{thresholds.low}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-300"></div>
            <span className="text-xs text-slate-600">{thresholds.low}-{thresholds.medium}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-300"></div>
            <span className="text-xs text-slate-600">{thresholds.medium}-{thresholds.high}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500"></div>
            <span className="text-xs text-slate-600">&gt;{thresholds.high}%</span>
          </div>
        </div>
      )}

      {/* En İyi / En Kötü Cohort */}
      {dashboard?.summary && (dashboard.summary.bestPerformingCohort || dashboard.summary.worstPerformingCohort) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {dashboard.summary.bestPerformingCohort && (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">En İyi Performans</span>
              </div>
              <p className="text-lg font-bold text-emerald-800">
                {dashboard.retentionMatrix?.find(r => r.cohortId === dashboard.summary.bestPerformingCohort)?.cohortLabel || dashboard.summary.bestPerformingCohort}
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                Ort. Retention: %{dashboard.cohorts?.find(c => c.cohortId === dashboard.summary.bestPerformingCohort)?.avgRetention || '-'}
              </p>
            </div>
          )}

          {dashboard.summary.worstPerformingCohort && (
            <div className="p-5 bg-red-50 rounded-2xl border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={18} className="text-red-600" />
                <span className="text-sm font-semibold text-red-700">Geliştirilmeli</span>
              </div>
              <p className="text-lg font-bold text-red-800">
                {dashboard.retentionMatrix?.find(r => r.cohortId === dashboard.summary.worstPerformingCohort)?.cohortLabel || dashboard.summary.worstPerformingCohort}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Ort. Retention: %{dashboard.cohorts?.find(c => c.cohortId === dashboard.summary.worstPerformingCohort)?.avgRetention || '-'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cohort Detayları */}
      {dashboard?.cohorts && dashboard.cohorts.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Cohort Detayları</h2>

          <div className="space-y-3">
            {dashboard.cohorts.slice(0, 6).map(cohort => (
              <div
                key={cohort.cohortId}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                  {cohort.cohortLabel.split(' ')[0].slice(0, 3)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{cohort.cohortLabel}</p>
                  <p className="text-xs text-slate-500">{cohort.initialCustomers} müşteri ile başladı</p>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">İlk Gelir</div>
                    <div className="font-semibold text-slate-700">
                      {cohort.initialRevenue.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Toplam Gelir</div>
                    <div className="font-semibold text-slate-700">
                      {cohort.totalCohortRevenue.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">LTV</div>
                    <div className="font-semibold text-emerald-600">
                      {cohort.lifetimeValue.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Ort. Retention</div>
                  <div className={`text-lg font-bold ${
                    cohort.avgRetention >= thresholds.high ? 'text-emerald-600' :
                    cohort.avgRetention >= thresholds.medium ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    %{cohort.avgRetention}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Veri yoksa */}
      {(!dashboard?.cohorts || dashboard.cohorts.length === 0) && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz Cohort Verisi Yok</h3>
          <p className="text-sm text-slate-500 mb-4">
            Cohort analizi için yeterli müşteri verisi bekleniyor.
          </p>
          <button
            onClick={handleCalculateCohort}
            disabled={isCalculating}
            className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:bg-violet-300"
          >
            İlk Analizi Başlat
          </button>
        </div>
      )}
    </div>
  )
}

export default CohortAnalysisTab
