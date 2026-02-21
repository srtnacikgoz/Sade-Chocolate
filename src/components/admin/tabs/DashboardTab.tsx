// src/components/admin/tabs/DashboardTab.tsx
// Ana Dashboard - Admin Panel Tab
// SaaS-Dostu: Config-driven, real-time updates, responsive charts

import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  getDashboardConfig,
  getDashboardData
} from '../../../services/dashboardService'
import {
  DashboardConfig,
  DashboardData,
  DateRangePreset,
  DATE_RANGE_PRESETS,
  formatCurrency
} from '../../../types/dashboard'
import { toast } from 'sonner'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Calendar,
  ShoppingCart,
  Users,
  Target,
  Package,
  Receipt,
  UserPlus,
  DollarSign,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react'

// KPI ikon mapping
const KPI_ICONS: Record<string, React.ElementType> = {
  'shopping-cart': ShoppingCart,
  'calendar': Calendar,
  'trending-up': TrendingUp,
  'receipt': Receipt,
  'target': Target,
  'users': Users,
  'package': Package,
  'user-plus': UserPlus
}

// KPI renk mapping
const KPI_COLORS: Record<string, { bg: string; text: string; light: string }> = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-50' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50' },
  slate: { bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-50' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50' }
}

export function DashboardTab() {
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('this_month')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Verileri yükle
  const loadData = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsRefreshing(true)
    try {
      const [configData, dashboardData] = await Promise.all([
        getDashboardConfig(),
        getDashboardData(selectedPreset)
      ])
      setConfig(configData)
      setData(dashboardData)
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [selectedPreset])

  // İlk yükleme
  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh
  useEffect(() => {
    if (!config?.autoRefresh) return

    const interval = setInterval(() => {
      loadData(false) // Sessiz refresh
    }, (config.refreshIntervalSeconds || 60) * 1000)

    return () => clearInterval(interval)
  }, [config?.autoRefresh, config?.refreshIntervalSeconds, loadData])

  // Tarih aralığı değiştiğinde
  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset)
    setShowDatePicker(false)
  }

  // Değişim ikonu
  const ChangeIndicator = ({ change, type }: { change: number | null; type: 'increase' | 'decrease' | 'neutral' }) => {
    if (change === null) return null

    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${
        type === 'increase' ? 'text-emerald-600' :
        type === 'decrease' ? 'text-red-600' : 'text-slate-500'
      }`}>
        {type === 'increase' && <TrendingUp size={12} />}
        {type === 'decrease' && <TrendingDown size={12} />}
        {type === 'neutral' && <Minus size={12} />}
        <span>{type === 'decrease' ? '' : '+'}{change}%</span>
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

  if (!config?.enabled) {
    return (
      <div className="p-8 text-center">
        <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Dashboard Devre Dışı</h2>
        <p className="text-slate-500">Bu özellik şu an aktif değil.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.dateRange.label || 'Genel Bakış'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tarih aralığı seçici */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Calendar size={16} />
              {DATE_RANGE_PRESETS.find(p => p.id === selectedPreset)?.label}
              <ChevronDown size={16} />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                {DATE_RANGE_PRESETS.filter(p => p.id !== 'custom').map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl ${
                      selectedPreset === preset.id ? 'bg-slate-100 font-medium' : ''
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh butonu */}
          <button
            onClick={() => loadData()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Yükleniyor...' : 'Yenile'}
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      {data?.kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {config.visibleKPIs.map(kpiId => {
            const kpi = data.kpis[kpiId as keyof typeof data.kpis]
            if (!kpi) return null

            const Icon = KPI_ICONS[kpi.icon] || DollarSign
            const colors = KPI_COLORS[kpi.color] || KPI_COLORS.slate

            return (
              <div
                key={kpi.id}
                className={`p-4 rounded-2xl border border-slate-100 ${colors.light}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <ChangeIndicator change={kpi.change} type={kpi.changeType} />
                </div>
                <div className="text-2xl font-bold text-slate-900 truncate">
                  {kpi.formattedValue}
                </div>
                <div className="text-xs text-slate-500 mt-1">{kpi.label}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Grafikler Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satış Trendi */}
        {config.visibleCharts.includes('salesTrend') && data?.salesTrend && (
          <div className="col-span-1 lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Satış Trendi</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-600">Bu Dönem</span>
                </div>
                {config.showComparison && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <span className="text-slate-600">Önceki Dönem</span>
                  </div>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Gelir']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
                {config.showComparison && (
                  <Line
                    type="monotone"
                    dataKey="previousRevenue"
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Saatlik Dağılım */}
        {config.visibleCharts.includes('hourlyDistribution') && data?.hourlyDistribution && (
          <div className="p-6 bg-white rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Saatlik Sipariş Dağılımı</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [value, 'Sipariş']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* En Çok Satan Ürünler */}
        {config.visibleCharts.includes('topProducts') && data?.topProducts && (
          <div className="p-6 bg-white rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">En Çok Satan Ürünler</h3>
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {product.productName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {product.quantity} adet • {formatCurrency(product.revenue)}
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${product.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">
                    %{product.percentage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trafik Kaynakları */}
        {config.visibleCharts.includes('trafficSources') && data?.trafficSources && (
          <div className="p-6 bg-white rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Trafik Kaynakları</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={data.trafficSources}
                    dataKey="visitors"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {data.trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.trafficSources.slice(0, 5).map((source) => (
                  <div key={source.source} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: source.color }}
                      ></div>
                      <span className="text-slate-700">{source.label}</span>
                    </div>
                    <span className="text-slate-500">{source.visitors} (%{source.percentage})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sipariş Durumu */}
        {config.visibleCharts.includes('orderStatus') && data?.orderStatusDistribution && (
          <div className="p-6 bg-white rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Sipariş Durumu Dağılımı</h3>
            <div className="space-y-3">
              {data.orderStatusDistribution.map((status) => (
                <div key={status.status} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{status.label}</span>
                      <span className="text-sm text-slate-500">{status.count}</span>
                    </div>
                    <div className="mt-1 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${status.percentage}%`, backgroundColor: status.color }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Son güncelleme */}
      {data?.calculatedAt && (
        <div className="text-center text-xs text-slate-400">
          Son güncelleme: {new Date(data.calculatedAt).toLocaleString('tr-TR')}
          {data.isRealTime && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-500">
              <Activity size={10} className="animate-pulse" />
              Canlı
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardTab
