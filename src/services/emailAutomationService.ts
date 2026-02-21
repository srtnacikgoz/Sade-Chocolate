// src/services/emailAutomationService.ts
// Email Pazarlama Otomasyonu Service
// SaaS-Dostu: Config-driven, event-based triggers

import { db } from '../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import {
  EmailAutomationConfig,
  EmailFlow,
  EmailStep,
  EmailLog,
  EmailQueueItem,
  FlowStats,
  DEFAULT_EMAIL_AUTOMATION_CONFIG,
  DEFAULT_FLOWS,
  EmailTriggerType
} from '../types/emailAutomation'

// =====================================================
// CONFIG MANAGEMENT
// =====================================================

/**
 * Email otomasyon konfigürasyonunu getir
 */
export async function getEmailAutomationConfig(): Promise<EmailAutomationConfig> {
  try {
    const configRef = doc(db, 'settings', 'email_automation_config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      return configSnap.data() as EmailAutomationConfig
    }

    // Default config oluştur
    await setDoc(configRef, DEFAULT_EMAIL_AUTOMATION_CONFIG)
    return DEFAULT_EMAIL_AUTOMATION_CONFIG
  } catch (error) {
    console.error('Email automation config yüklenemedi:', error)
    return DEFAULT_EMAIL_AUTOMATION_CONFIG
  }
}

/**
 * Email otomasyon konfigürasyonunu güncelle
 */
export async function updateEmailAutomationConfig(
  updates: Partial<EmailAutomationConfig>,
  updatedBy?: string
): Promise<void> {
  try {
    const configRef = doc(db, 'settings', 'email_automation_config')
    await setDoc(configRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || null
    }, { merge: true })
  } catch (error) {
    console.error('Email automation config güncellenemedi:', error)
    throw error
  }
}

// =====================================================
// FLOW MANAGEMENT
// =====================================================

/**
 * Tüm email flow'larını getir
 */
export async function getEmailFlows(): Promise<EmailFlow[]> {
  try {
    const flowsRef = collection(db, 'email_flows')
    const q = query(flowsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EmailFlow[]
  } catch (error) {
    console.error('Email flows getirilemedi:', error)
    return []
  }
}

/**
 * Tek bir flow getir
 */
export async function getEmailFlow(flowId: string): Promise<EmailFlow | null> {
  try {
    const flowRef = doc(db, 'email_flows', flowId)
    const flowSnap = await getDoc(flowRef)

    if (flowSnap.exists()) {
      return { id: flowSnap.id, ...flowSnap.data() } as EmailFlow
    }
    return null
  } catch (error) {
    console.error('Email flow getirilemedi:', error)
    return null
  }
}

/**
 * Yeni flow oluştur
 */
export async function createEmailFlow(
  flow: Omit<EmailFlow, 'id' | 'createdAt' | 'updatedAt' | 'stats'>
): Promise<string> {
  try {
    const flowsRef = collection(db, 'email_flows')
    const newFlowRef = doc(flowsRef)

    const newFlow: EmailFlow = {
      ...flow,
      id: newFlowRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalConverted: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        lastCalculated: new Date().toISOString()
      }
    }

    await setDoc(newFlowRef, newFlow)
    return newFlowRef.id
  } catch (error) {
    console.error('Email flow oluşturulamadı:', error)
    throw error
  }
}

/**
 * Flow güncelle
 */
export async function updateEmailFlow(
  flowId: string,
  updates: Partial<EmailFlow>
): Promise<void> {
  try {
    const flowRef = doc(db, 'email_flows', flowId)
    await updateDoc(flowRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Email flow güncellenemedi:', error)
    throw error
  }
}

/**
 * Flow sil
 */
export async function deleteEmailFlow(flowId: string): Promise<void> {
  try {
    const flowRef = doc(db, 'email_flows', flowId)
    await deleteDoc(flowRef)
  } catch (error) {
    console.error('Email flow silinemedi:', error)
    throw error
  }
}

/**
 * Flow aktif/pasif yap
 */
export async function toggleFlowStatus(flowId: string, isActive: boolean): Promise<void> {
  try {
    const flowRef = doc(db, 'email_flows', flowId)
    await updateDoc(flowRef, {
      isActive,
      isDraft: false,
      updatedAt: new Date().toISOString()
    })

    // Config'deki activeFlows listesini güncelle
    const config = await getEmailAutomationConfig()
    let activeFlows = config.activeFlows || []

    if (isActive) {
      if (!activeFlows.includes(flowId)) {
        activeFlows.push(flowId)
      }
    } else {
      activeFlows = activeFlows.filter(id => id !== flowId)
    }

    await updateEmailAutomationConfig({ activeFlows })
  } catch (error) {
    console.error('Flow status değiştirilemedi:', error)
    throw error
  }
}

/**
 * Default flow'ları oluştur (ilk kurulum için)
 */
export async function initializeDefaultFlows(): Promise<void> {
  try {
    const existingFlows = await getEmailFlows()

    for (const defaultFlow of DEFAULT_FLOWS) {
      const exists = existingFlows.some(f => f.id === defaultFlow.id)
      if (!exists && defaultFlow.id) {
        const flowRef = doc(db, 'email_flows', defaultFlow.id)
        await setDoc(flowRef, {
          ...defaultFlow,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          stats: {
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalConverted: 0,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
            lastCalculated: new Date().toISOString()
          }
        })
      }
    }
  } catch (error) {
    console.error('Default flows oluşturulamadı:', error)
    throw error
  }
}

// =====================================================
// STEP MANAGEMENT
// =====================================================

/**
 * Flow'a step ekle
 */
export async function addStepToFlow(
  flowId: string,
  step: Omit<EmailStep, 'id' | 'order'>
): Promise<string> {
  try {
    const flow = await getEmailFlow(flowId)
    if (!flow) throw new Error('Flow bulunamadı')

    const newStepId = `step-${Date.now()}`
    const newOrder = flow.steps.length + 1

    const newStep: EmailStep = {
      ...step,
      id: newStepId,
      order: newOrder
    }

    await updateEmailFlow(flowId, {
      steps: [...flow.steps, newStep]
    })

    return newStepId
  } catch (error) {
    console.error('Step eklenemedi:', error)
    throw error
  }
}

/**
 * Step güncelle
 */
export async function updateStep(
  flowId: string,
  stepId: string,
  updates: Partial<EmailStep>
): Promise<void> {
  try {
    const flow = await getEmailFlow(flowId)
    if (!flow) throw new Error('Flow bulunamadı')

    const updatedSteps = flow.steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    )

    await updateEmailFlow(flowId, { steps: updatedSteps })
  } catch (error) {
    console.error('Step güncellenemedi:', error)
    throw error
  }
}

/**
 * Step sil
 */
export async function deleteStep(flowId: string, stepId: string): Promise<void> {
  try {
    const flow = await getEmailFlow(flowId)
    if (!flow) throw new Error('Flow bulunamadı')

    const updatedSteps = flow.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }))

    await updateEmailFlow(flowId, { steps: updatedSteps })
  } catch (error) {
    console.error('Step silinemedi:', error)
    throw error
  }
}

/**
 * Step sırasını değiştir
 */
export async function reorderSteps(flowId: string, stepIds: string[]): Promise<void> {
  try {
    const flow = await getEmailFlow(flowId)
    if (!flow) throw new Error('Flow bulunamadı')

    const reorderedSteps = stepIds.map((stepId, index) => {
      const step = flow.steps.find(s => s.id === stepId)
      if (!step) throw new Error(`Step bulunamadı: ${stepId}`)
      return { ...step, order: index + 1 }
    })

    await updateEmailFlow(flowId, { steps: reorderedSteps })
  } catch (error) {
    console.error('Step sırası değiştirilemedi:', error)
    throw error
  }
}

// =====================================================
// EMAIL LOGS
// =====================================================

/**
 * Email loglarını getir (filtrelenmiş)
 */
export async function getEmailLogs(options?: {
  flowId?: string
  customerId?: string
  status?: string
  limit?: number
}): Promise<EmailLog[]> {
  try {
    const logsRef = collection(db, 'email_logs')
    let q = query(logsRef, orderBy('createdAt', 'desc'))

    if (options?.flowId) {
      q = query(q, where('flowId', '==', options.flowId))
    }

    if (options?.customerId) {
      q = query(q, where('customerId', '==', options.customerId))
    }

    if (options?.status) {
      q = query(q, where('status', '==', options.status))
    }

    if (options?.limit) {
      q = query(q, limit(options.limit))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EmailLog[]
  } catch (error) {
    console.error('Email logs getirilemedi:', error)
    return []
  }
}

/**
 * Flow istatistiklerini hesapla
 */
export async function calculateFlowStats(flowId: string): Promise<FlowStats> {
  try {
    const logs = await getEmailLogs({ flowId })

    const totalSent = logs.filter(l => l.status !== 'scheduled' && l.status !== 'failed').length
    const totalOpened = logs.filter(l => l.status === 'opened' || l.status === 'clicked').length
    const totalClicked = logs.filter(l => l.status === 'clicked').length

    // Conversion: Email sonrası sipariş verdi mi? (basit hesaplama)
    // Gerçek implementasyonda orders collection'a bakılmalı
    const totalConverted = 0

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalConverted,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      conversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0,
      lastCalculated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Flow stats hesaplanamadı:', error)
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalConverted: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      lastCalculated: new Date().toISOString()
    }
  }
}

/**
 * Tüm flow'ların istatistiklerini güncelle
 */
export async function updateAllFlowStats(): Promise<void> {
  try {
    const flows = await getEmailFlows()

    for (const flow of flows) {
      const stats = await calculateFlowStats(flow.id)
      await updateEmailFlow(flow.id, { stats })
    }
  } catch (error) {
    console.error('Flow stats güncellenemedi:', error)
    throw error
  }
}

// =====================================================
// QUEUE MANAGEMENT
// =====================================================

/**
 * Email kuyruğunu getir
 */
export async function getEmailQueue(options?: {
  status?: string
  limit?: number
}): Promise<EmailQueueItem[]> {
  try {
    const queueRef = collection(db, 'email_queue')
    let q = query(queueRef, orderBy('scheduledAt', 'asc'))

    if (options?.status) {
      q = query(q, where('status', '==', options.status))
    }

    if (options?.limit) {
      q = query(q, limit(options.limit))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EmailQueueItem[]
  } catch (error) {
    console.error('Email queue getirilemedi:', error)
    return []
  }
}

/**
 * Kuyruktan email iptal et
 */
export async function cancelQueuedEmail(queueId: string): Promise<void> {
  try {
    const queueRef = doc(db, 'email_queue', queueId)
    await updateDoc(queueRef, {
      status: 'cancelled'
    })
  } catch (error) {
    console.error('Kuyruk emaili iptal edilemedi:', error)
    throw error
  }
}

// =====================================================
// DASHBOARD DATA
// =====================================================

export type EmailAutomationDashboard = {
  config: EmailAutomationConfig
  flows: EmailFlow[]
  recentLogs: EmailLog[]
  pendingQueue: number
  todayStats: {
    sent: number
    opened: number
    clicked: number
  }
}

/**
 * Dashboard için tüm verileri getir
 */
export async function getEmailAutomationDashboard(): Promise<EmailAutomationDashboard> {
  try {
    const [config, flows, recentLogs, queue] = await Promise.all([
      getEmailAutomationConfig(),
      getEmailFlows(),
      getEmailLogs({ limit: 20 }),
      getEmailQueue({ status: 'pending', limit: 100 })
    ])

    // Bugünün istatistikleri
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayLogs = recentLogs.filter(log => {
      const logDate = new Date(log.createdAt)
      return logDate >= today
    })

    return {
      config,
      flows,
      recentLogs,
      pendingQueue: queue.length,
      todayStats: {
        sent: todayLogs.filter(l => l.status !== 'scheduled' && l.status !== 'failed').length,
        opened: todayLogs.filter(l => l.status === 'opened' || l.status === 'clicked').length,
        clicked: todayLogs.filter(l => l.status === 'clicked').length
      }
    }
  } catch (error) {
    console.error('Dashboard verileri getirilemedi:', error)
    throw error
  }
}

// =====================================================
// TRIGGER HELPERS
// =====================================================

/**
 * Belirli bir trigger tipi için aktif flow'ları getir
 */
export async function getActiveFlowsByTrigger(triggerType: EmailTriggerType): Promise<EmailFlow[]> {
  try {
    const flows = await getEmailFlows()
    return flows.filter(f => f.isActive && f.trigger.type === triggerType)
  } catch (error) {
    console.error('Aktif flow\'lar getirilemedi:', error)
    return []
  }
}
