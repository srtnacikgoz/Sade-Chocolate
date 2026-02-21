// src/components/admin/tabs/EmailAutomationTab.tsx
// Email Pazarlama Otomasyonu - Admin Panel Tab
// SaaS-Dostu: Config-driven, visual flow builder

import React, { useState, useEffect } from 'react'
import {
  getEmailAutomationDashboard,
  getEmailFlows,
  toggleFlowStatus,
  initializeDefaultFlows,
  updateEmailAutomationConfig,
  createEmailFlow,
  deleteEmailFlow,
  addStepToFlow,
  updateStep,
  deleteStep
} from '../../../services/emailAutomationService'
import {
  EmailAutomationConfig,
  EmailFlow,
  EmailStep,
  EmailLog,
  EMAIL_TRIGGERS,
  EmailTriggerType,
  formatDelay,
  getStatusColor,
  getStatusLabel
} from '../../../types/emailAutomation'
import { toast } from 'sonner'
import {
  Mail,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  Eye,
  MousePointer,
  RefreshCw,
  Settings,
  Zap,
  Gift,
  ShoppingCart,
  Heart,
  UserPlus,
  Calendar,
  Package,
  UserMinus,
  Send,
  BarChart3,
  ArrowRight,
  X,
  Check,
  AlertTriangle,
  Copy
} from 'lucide-react'

// Trigger icon mapping
const TRIGGER_ICONS: Record<string, React.ElementType> = {
  'user-plus': UserPlus,
  'shopping-bag': ShoppingCart,
  'package': Package,
  'shopping-cart': ShoppingCart,
  'heart': Heart,
  'gift': Gift,
  'calendar': Calendar,
  'users': Users,
  'user-minus': UserMinus,
  'zap': Zap
}

export function EmailAutomationTab() {
  const [isLoading, setIsLoading] = useState(true)
  const [config, setConfig] = useState<EmailAutomationConfig | null>(null)
  const [flows, setFlows] = useState<EmailFlow[]>([])
  const [recentLogs, setRecentLogs] = useState<EmailLog[]>([])
  const [todayStats, setTodayStats] = useState({ sent: 0, opened: 0, clicked: 0 })
  const [pendingQueue, setPendingQueue] = useState(0)

  // UI State
  const [activeView, setActiveView] = useState<'dashboard' | 'flows' | 'settings'>('dashboard')
  const [selectedFlow, setSelectedFlow] = useState<EmailFlow | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showStepModal, setShowStepModal] = useState(false)
  const [editingStep, setEditingStep] = useState<EmailStep | null>(null)

  // Verileri yükle
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const dashboard = await getEmailAutomationDashboard()
      setConfig(dashboard.config)
      setFlows(dashboard.flows)
      setRecentLogs(dashboard.recentLogs)
      setTodayStats(dashboard.todayStats)
      setPendingQueue(dashboard.pendingQueue)

      // Default flow'ları oluştur (ilk yükleme)
      if (dashboard.flows.length === 0) {
        await initializeDefaultFlows()
        const newFlows = await getEmailFlows()
        setFlows(newFlows)
      }
    } catch (error) {
      console.error('Veriler yüklenemedi:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Flow durumunu değiştir
  const handleToggleFlow = async (flowId: string, isActive: boolean) => {
    try {
      await toggleFlowStatus(flowId, !isActive)
      setFlows(flows.map(f =>
        f.id === flowId ? { ...f, isActive: !isActive, isDraft: false } : f
      ))
      toast.success(isActive ? 'Akış durduruldu' : 'Akış başlatıldı')
    } catch (error) {
      console.error('Flow durumu değiştirilemedi:', error)
      toast.error('İşlem başarısız')
    }
  }

  // Sistem durumunu değiştir
  const handleToggleSystem = async () => {
    if (!config) return

    try {
      await updateEmailAutomationConfig({ enabled: !config.enabled })
      setConfig({ ...config, enabled: !config.enabled })
      toast.success(config.enabled ? 'Email otomasyon durduruldu' : 'Email otomasyon başlatıldı')
    } catch (error) {
      toast.error('İşlem başarısız')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Otomasyonu</h1>
          <p className="text-sm text-slate-500 mt-1">
            Müşteri yolculuğu boyunca otomatik email akışları
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sistem durumu */}
          <button
            onClick={handleToggleSystem}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              config?.enabled
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {config?.enabled ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Aktif
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Sistem Pasif
              </>
            )}
          </button>

          {/* Tab navigasyonu */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'flows', label: 'Akışlar', icon: Zap },
              { id: 'settings', label: 'Ayarlar', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === tab.id
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <DashboardView
          todayStats={todayStats}
          pendingQueue={pendingQueue}
          flows={flows}
          recentLogs={recentLogs}
          onFlowClick={(flow) => {
            setSelectedFlow(flow)
            setActiveView('flows')
          }}
        />
      )}

      {/* Flows View */}
      {activeView === 'flows' && (
        <FlowsView
          flows={flows}
          selectedFlow={selectedFlow}
          onSelectFlow={setSelectedFlow}
          onToggleFlow={handleToggleFlow}
          onCreateFlow={() => setShowCreateModal(true)}
          onDeleteFlow={async (flowId) => {
            if (confirm('Bu akışı silmek istediğinize emin misiniz?')) {
              await deleteEmailFlow(flowId)
              setFlows(flows.filter(f => f.id !== flowId))
              if (selectedFlow?.id === flowId) setSelectedFlow(null)
              toast.success('Akış silindi')
            }
          }}
          onAddStep={() => setShowStepModal(true)}
          onEditStep={(step) => {
            setEditingStep(step)
            setShowStepModal(true)
          }}
          onDeleteStep={async (stepId) => {
            if (!selectedFlow) return
            if (confirm('Bu adımı silmek istediğinize emin misiniz?')) {
              await deleteStep(selectedFlow.id, stepId)
              const updated = await getEmailFlows()
              setFlows(updated)
              setSelectedFlow(updated.find(f => f.id === selectedFlow.id) || null)
              toast.success('Adım silindi')
            }
          }}
          onRefresh={loadData}
        />
      )}

      {/* Settings View */}
      {activeView === 'settings' && config && (
        <SettingsView
          config={config}
          onSave={async (updates) => {
            await updateEmailAutomationConfig(updates)
            setConfig({ ...config, ...updates })
            toast.success('Ayarlar kaydedildi')
          }}
        />
      )}

      {/* Create Flow Modal */}
      {showCreateModal && (
        <CreateFlowModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (flow) => {
            const flowId = await createEmailFlow(flow as any)
            const updated = await getEmailFlows()
            setFlows(updated)
            setSelectedFlow(updated.find(f => f.id === flowId) || null)
            setShowCreateModal(false)
            toast.success('Akış oluşturuldu')
          }}
        />
      )}

      {/* Step Modal */}
      {showStepModal && selectedFlow && (
        <StepModal
          flow={selectedFlow}
          step={editingStep}
          onClose={() => {
            setShowStepModal(false)
            setEditingStep(null)
          }}
          onSave={async (stepData) => {
            if (editingStep) {
              await updateStep(selectedFlow.id, editingStep.id, stepData)
            } else {
              await addStepToFlow(selectedFlow.id, stepData as any)
            }
            const updated = await getEmailFlows()
            setFlows(updated)
            setSelectedFlow(updated.find(f => f.id === selectedFlow.id) || null)
            setShowStepModal(false)
            setEditingStep(null)
            toast.success(editingStep ? 'Adım güncellendi' : 'Adım eklendi')
          }}
        />
      )}
    </div>
  )
}

// =====================================================
// DASHBOARD VIEW
// =====================================================

function DashboardView({
  todayStats,
  pendingQueue,
  flows,
  recentLogs,
  onFlowClick
}: {
  todayStats: { sent: number; opened: number; clicked: number }
  pendingQueue: number
  flows: EmailFlow[]
  recentLogs: EmailLog[]
  onFlowClick: (flow: EmailFlow) => void
}) {
  const activeFlows = flows.filter(f => f.isActive).length
  const openRate = todayStats.sent > 0 ? (todayStats.opened / todayStats.sent) * 100 : 0
  const clickRate = todayStats.sent > 0 ? (todayStats.clicked / todayStats.sent) * 100 : 0

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Send size={18} className="text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Bugün Gönderilen</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{todayStats.sent}</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Eye size={18} className="text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500">Açılma Oranı</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{openRate.toFixed(1)}%</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <MousePointer size={18} className="text-purple-600" />
            </div>
            <span className="text-sm text-slate-500">Tıklama Oranı</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{clickRate.toFixed(1)}%</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">Kuyrukta Bekleyen</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{pendingQueue}</p>
        </div>
      </div>

      {/* Aktif Akışlar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap size={18} className="text-amber-500" />
          Email Akışları
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map(flow => {
            const TriggerIcon = TRIGGER_ICONS[flow.trigger?.icon || 'zap'] || Zap

            return (
              <button
                key={flow.id}
                onClick={() => onFlowClick(flow)}
                className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <TriggerIcon size={18} className="text-slate-600" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    flow.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : flow.isDraft
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {flow.isActive ? 'Aktif' : flow.isDraft ? 'Taslak' : 'Pasif'}
                  </span>
                </div>

                <h4 className="font-semibold text-slate-900 mb-1">{flow.name}</h4>
                <p className="text-xs text-slate-500 mb-3">{flow.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail size={12} />
                    {flow.steps.length} email
                  </span>
                  {flow.stats && (
                    <>
                      <span>{flow.stats.totalSent} gönderildi</span>
                      <span>{flow.stats.openRate.toFixed(0)}% açıldı</span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Son Aktiviteler */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-slate-500" />
          Son Aktiviteler
        </h3>

        {recentLogs.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Henüz aktivite yok</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                  {getStatusLabel(log.status)}
                </span>
                <span className="text-sm text-slate-700 flex-1">{log.customerEmail}</span>
                <span className="text-xs text-slate-500 truncate max-w-[200px]">{log.subject}</span>
                <span className="text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// FLOWS VIEW
// =====================================================

function FlowsView({
  flows,
  selectedFlow,
  onSelectFlow,
  onToggleFlow,
  onCreateFlow,
  onDeleteFlow,
  onAddStep,
  onEditStep,
  onDeleteStep,
  onRefresh
}: {
  flows: EmailFlow[]
  selectedFlow: EmailFlow | null
  onSelectFlow: (flow: EmailFlow | null) => void
  onToggleFlow: (flowId: string, isActive: boolean) => void
  onCreateFlow: () => void
  onDeleteFlow: (flowId: string) => void
  onAddStep: () => void
  onEditStep: (step: EmailStep) => void
  onDeleteStep: (stepId: string) => void
  onRefresh: () => void
}) {
  return (
    <div className="flex gap-6">
      {/* Flow Listesi */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Akışlar</h3>
            <button
              onClick={onCreateFlow}
              className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {flows.map(flow => {
              const TriggerIcon = TRIGGER_ICONS[flow.trigger?.icon || 'zap'] || Zap
              const isSelected = selectedFlow?.id === flow.id

              return (
                <button
                  key={flow.id}
                  onClick={() => onSelectFlow(flow)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TriggerIcon size={16} className={isSelected ? 'text-white' : 'text-slate-500'} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {flow.name}
                      </p>
                      <p className={`text-xs truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {flow.steps.length} adım
                      </p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      flow.isActive ? 'bg-emerald-400' : 'bg-slate-300'
                    }`} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Flow Detay */}
      {selectedFlow ? (
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedFlow.name}</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedFlow.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFlow(selectedFlow.id, selectedFlow.isActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedFlow.isActive
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {selectedFlow.isActive ? (
                  <>
                    <Pause size={14} />
                    Durdur
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Başlat
                  </>
                )}
              </button>

              <button
                onClick={() => onDeleteFlow(selectedFlow.id)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* İstatistikler */}
          {selectedFlow.stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">Gönderilen</p>
                <p className="text-xl font-bold text-slate-900">{selectedFlow.stats.totalSent}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">Açılan</p>
                <p className="text-xl font-bold text-slate-900">{selectedFlow.stats.totalOpened}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">Tıklanan</p>
                <p className="text-xl font-bold text-slate-900">{selectedFlow.stats.totalClicked}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">Açılma Oranı</p>
                <p className="text-xl font-bold text-slate-900">{selectedFlow.stats.openRate.toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Trigger Bilgisi */}
          <div className="p-4 bg-blue-50 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Zap size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Tetikleyici: {selectedFlow.trigger.name.tr}</p>
                <p className="text-sm text-blue-700">{selectedFlow.trigger.description.tr}</p>
              </div>
            </div>
          </div>

          {/* Email Adımları */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Email Adımları</h3>
              <button
                onClick={onAddStep}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Adım Ekle
              </button>
            </div>

            {selectedFlow.steps.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Mail size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">Henüz email adımı yok</p>
                <button
                  onClick={onAddStep}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  İlk adımı ekle
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedFlow.steps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-4 border rounded-xl transition-all ${
                        step.isActive
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-100 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Step Number */}
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                              {formatDelay(step.delayValue, step.delayUnit)}
                            </span>
                            {step.abTest?.enabled && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                A/B Test
                              </span>
                            )}
                            {!step.isActive && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                                Pasif
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-slate-900 truncate">{step.subject}</p>
                          <p className="text-xs text-slate-500">Template: {step.templateId}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditStep(step)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteStep(step.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Arrow to next */}
                      {index < selectedFlow.steps.length - 1 && (
                        <div className="flex justify-center mt-3 -mb-1">
                          <ArrowRight size={16} className="text-slate-300 rotate-90" />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-2xl">
          <div className="text-center">
            <Mail size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Bir akış seçin veya yeni oluşturun</p>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// SETTINGS VIEW
// =====================================================

function SettingsView({
  config,
  onSave
}: {
  config: EmailAutomationConfig
  onSave: (updates: Partial<EmailAutomationConfig>) => Promise<void>
}) {
  const [formData, setFormData] = useState(config)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(formData)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-900">Genel Ayarlar</h3>

        {/* Gönderici Bilgileri */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gönderici Adı
            </label>
            <input
              type="text"
              value={formData.defaultFromName}
              onChange={(e) => setFormData({ ...formData, defaultFromName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gönderici Email
            </label>
            <input
              type="email"
              value={formData.defaultFromEmail}
              onChange={(e) => setFormData({ ...formData, defaultFromEmail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Limitler */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="font-medium text-slate-900 mb-4">Limitler</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Günlük Max Email
              </label>
              <input
                type="number"
                value={formData.maxEmailsPerDay}
                onChange={(e) => setFormData({ ...formData, maxEmailsPerDay: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kişi Başı Günlük Max
              </label>
              <input
                type="number"
                value={formData.maxEmailsPerCustomerPerDay}
                onChange={(e) => setFormData({ ...formData, maxEmailsPerCustomerPerDay: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Çalışma Saatleri */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900">Çalışma Saatleri</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.workingHours.enabled}
                onChange={(e) => setFormData({
                  ...formData,
                  workingHours: { ...formData.workingHours, enabled: e.target.checked }
                })}
                className="w-4 h-4 rounded text-blue-500"
              />
              <span className="text-sm text-slate-600">Aktif</span>
            </label>
          </div>

          {formData.workingHours.enabled && (
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Başlangıç</label>
                <select
                  value={formData.workingHours.startHour}
                  onChange={(e) => setFormData({
                    ...formData,
                    workingHours: { ...formData.workingHours, startHour: Number(e.target.value) }
                  })}
                  className="px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <span className="text-slate-400 mt-5">-</span>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Bitiş</label>
                <select
                  value={formData.workingHours.endHour}
                  onChange={(e) => setFormData({
                    ...formData,
                    workingHours: { ...formData.workingHours, endHour: Number(e.target.value) }
                  })}
                  className="px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Kaydet */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// CREATE FLOW MODAL
// =====================================================

function CreateFlowModal({
  onClose,
  onCreate
}: {
  onClose: () => void
  onCreate: (flow: Partial<EmailFlow>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<EmailTriggerType>('welcome')
  const [isCreating, setIsCreating] = useState(false)

  const selectedTrigger = EMAIL_TRIGGERS.find(t => t.type === triggerType)

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Akış adı zorunlu')
      return
    }

    setIsCreating(true)
    try {
      await onCreate({
        name,
        description,
        trigger: selectedTrigger!,
        steps: [],
        isActive: false,
        isDraft: true,
        createdBy: null
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Yeni Akış Oluştur</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Akış Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Hoşgeldin Serisi"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Akışın amacı..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tetikleyici
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EMAIL_TRIGGERS.slice(0, 6).map(trigger => {
                const Icon = TRIGGER_ICONS[trigger.icon] || Zap
                return (
                  <button
                    key={trigger.type}
                    onClick={() => setTriggerType(trigger.type)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      triggerType === trigger.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={16} className={triggerType === trigger.type ? 'text-blue-500' : 'text-slate-500'} />
                    <p className={`text-sm font-medium mt-1 ${triggerType === trigger.type ? 'text-blue-700' : 'text-slate-700'}`}>
                      {trigger.name.tr}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// STEP MODAL
// =====================================================

function StepModal({
  flow,
  step,
  onClose,
  onSave
}: {
  flow: EmailFlow
  step: EmailStep | null
  onClose: () => void
  onSave: (data: Partial<EmailStep>) => Promise<void>
}) {
  const [subject, setSubject] = useState(step?.subject || '')
  const [templateId, setTemplateId] = useState(step?.templateId || '')
  const [delayValue, setDelayValue] = useState(step?.delayValue || 0)
  const [delayUnit, setDelayUnit] = useState<'minutes' | 'hours' | 'days'>(step?.delayUnit || 'hours')
  const [isActive, setIsActive] = useState(step?.isActive ?? true)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!subject.trim() || !templateId.trim()) {
      toast.error('Konu ve template zorunlu')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        subject,
        templateId,
        delayValue,
        delayUnit,
        isActive
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {step ? 'Adımı Düzenle' : 'Yeni Adım Ekle'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Zamanlama */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Gönderim Zamanı
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={delayValue}
                onChange={(e) => setDelayValue(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={delayUnit}
                onChange={(e) => setDelayUnit(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="minutes">Dakika sonra</option>
                <option value="hours">Saat sonra</option>
                <option value="days">Gün sonra</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {formatDelay(delayValue, delayUnit)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Konusu
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Örn: Hoşgeldin! 🍫"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Template ID
            </label>
            <input
              type="text"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="Örn: welcome-1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              SendGrid'de tanımlı template ID
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-500"
            />
            <span className="text-sm text-slate-700">Aktif</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !subject.trim() || !templateId.trim()}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailAutomationTab
