// src/components/admin/tabs/ReportsTab.tsx
// Rapor Export - Admin Panel Tab
// SaaS-Dostu: Config-driven, multi-format export

import React, { useState, useEffect } from 'react'
import {
  getReportConfig,
  exportReport
} from '../../../services/reportExportService'
import {
  ReportConfig,
  ReportType,
  ExportFormat,
  ExportRequest,
  REPORT_DEFINITIONS,
  DATE_RANGE_PRESETS
} from '../../../types/reports'
import { DateRangePreset, getDateRangeFromPreset } from '../../../types/dashboard'
import { toast } from 'sonner'
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Filter,
  Clock
} from 'lucide-react'

// Rapor ikonları
const REPORT_ICONS: Record<string, React.ElementType> = {
  'shopping-cart': ShoppingCart,
  'users': Users,
  'trending-up': TrendingUp,
  'package': Package,
  'dollar-sign': DollarSign
}

// Format ikonları
const FORMAT_ICONS: Record<ExportFormat, { icon: React.ElementType; label: string; color: string }> = {
  xlsx: { icon: FileSpreadsheet, label: 'Excel', color: 'bg-emerald-500' },
  csv: { icon: FileText, label: 'CSV', color: 'bg-blue-500' }
}

export function ReportsTab() {
  const [config, setConfig] = useState<ReportConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [exportingReport, setExportingReport] = useState<string | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>('this_month')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [recentExports, setRecentExports] = useState<{
    reportType: string
    format: string
    recordCount: number
    timestamp: Date
  }[]>([])

  // Config yükle
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const configData = await getReportConfig()
      setConfig(configData)
    } catch (error) {
      console.error('Report config yüklenemedi:', error)
      toast.error('Ayarlar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Export işlemi
  const handleExport = async (reportType: ReportType, format: ExportFormat) => {
    if (!config?.enabled) {
      toast.error('Rapor sistemi devre dışı')
      return
    }

    const definition = REPORT_DEFINITIONS.find(r => r.id === reportType)
    if (!definition) {
      toast.error('Rapor tanımı bulunamadı')
      return
    }

    setExportingReport(`${reportType}-${format}`)

    try {
      const request: ExportRequest = {
        reportType,
        format
      }

      // Tarih aralığı gerekliyse ekle
      if (definition.defaultDateRange) {
        const { startDate, endDate } = getDateRangeFromPreset(selectedDateRange)
        request.dateRange = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }

      const result = await exportReport(request)

      if (result.success) {
        toast.success(`${definition.name.tr} başarıyla indirildi (${result.recordCount} kayıt)`)

        // Son export'lara ekle
        setRecentExports(prev => [{
          reportType: definition.name.tr,
          format: format.toUpperCase(),
          recordCount: result.recordCount,
          timestamp: new Date()
        }, ...prev.slice(0, 4)])
      } else {
        toast.error(result.error || 'Export sırasında hata oluştu')
      }
    } catch (error: any) {
      console.error('Export hatası:', error)
      toast.error(error.message || 'Export sırasında hata oluştu')
    } finally {
      setExportingReport(null)
    }
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
        <h2 className="text-xl font-bold text-slate-800 mb-2">Rapor Sistemi Devre Dışı</h2>
        <p className="text-slate-500">Bu özellik şu an aktif değil.</p>
      </div>
    )
  }

  // İzin verilen raporları filtrele
  const allowedReports = REPORT_DEFINITIONS.filter(r => config.allowedReports.includes(r.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raporlar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verilerinizi Excel veya CSV formatında dışa aktarın
          </p>
        </div>

        {/* Tarih aralığı seçici */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Calendar size={16} />
            {DATE_RANGE_PRESETS.find(p => p.id === selectedDateRange)?.label || 'Bu Ay'}
            <ChevronDown size={16} />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
              {DATE_RANGE_PRESETS.filter(p => p.id !== 'custom').map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedDateRange(preset.id)
                    setShowDatePicker(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl ${
                    selectedDateRange === preset.id ? 'bg-slate-100 font-medium' : ''
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bilgi kartı */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
        <Filter size={20} className="text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800">
            <strong>Tarih Filtresi:</strong> Sipariş ve Satış raporları seçili tarih aralığına göre filtrelenir.
            Müşteri, Stok, RFM ve CLV raporları tüm verileri içerir.
          </p>
        </div>
      </div>

      {/* Rapor kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allowedReports.map(report => {
          const Icon = REPORT_ICONS[report.icon] || FileSpreadsheet
          const isExporting = exportingReport?.startsWith(report.id)

          return (
            <div
              key={report.id}
              className="p-6 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Icon size={24} className="text-slate-600" />
                </div>
                {report.defaultDateRange && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <Calendar size={10} />
                    Tarih Filtreli
                  </span>
                )}
              </div>

              {/* İçerik */}
              <h3 className="text-lg font-bold text-slate-900 mb-1">{report.name.tr}</h3>
              <p className="text-sm text-slate-500 mb-4">{report.description.tr}</p>

              {/* Alanlar */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">İçerik:</p>
                <div className="flex flex-wrap gap-1">
                  {report.fields.slice(0, 5).map(field => (
                    <span
                      key={field.key}
                      className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded"
                    >
                      {field.label.tr}
                    </span>
                  ))}
                  {report.fields.length > 5 && (
                    <span className="text-xs text-slate-400">
                      +{report.fields.length - 5} daha
                    </span>
                  )}
                </div>
              </div>

              {/* Export butonları */}
              <div className="flex gap-2">
                {report.supportedFormats
                  .filter(f => config.allowedFormats.includes(f))
                  .map(format => {
                    const formatInfo = FORMAT_ICONS[format]
                    const FormatIcon = formatInfo.icon
                    const isThisExporting = exportingReport === `${report.id}-${format}`

                    return (
                      <button
                        key={format}
                        onClick={() => handleExport(report.id, format)}
                        disabled={isExporting}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          isThisExporting
                            ? 'bg-slate-100 text-slate-400'
                            : `${formatInfo.color} text-white hover:opacity-90`
                        }`}
                      >
                        {isThisExporting ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <FormatIcon size={14} />
                        )}
                        {formatInfo.label}
                      </button>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Son Export'lar */}
      {recentExports.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={18} />
            Son İndirilenler
          </h2>
          <div className="space-y-2">
            {recentExports.map((exp, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
              >
                <CheckCircle size={16} className="text-emerald-500" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-800">{exp.reportType}</span>
                  <span className="text-xs text-slate-500 ml-2">({exp.format})</span>
                </div>
                <span className="text-xs text-slate-500">{exp.recordCount} kayıt</span>
                <span className="text-xs text-slate-400">
                  {exp.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kullanım bilgisi */}
      <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-900 mb-3">💡 Kullanım İpuçları</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500">•</span>
            <span><strong>Excel (XLSX):</strong> Formatlı veriler, para birimi ve tarih formatları korunur</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span><strong>CSV:</strong> Tüm programlarla uyumlu, büyük veriler için ideal</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span><strong>Maksimum kayıt:</strong> Performans için en fazla {config.maxRecordsPerExport.toLocaleString('tr-TR')} kayıt dışa aktarılır</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ReportsTab
