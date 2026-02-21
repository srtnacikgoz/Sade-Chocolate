// src/types/emailAutomation.ts
// Email Pazarlama Otomasyonu Types
// SaaS-Dostu: Config-driven, event-based, multi-tenant ready

// =====================================================
// TRIGGER TYPES
// =====================================================

export type EmailTriggerType =
  | 'welcome'              // Yeni kayıt
  | 'first_purchase'       // İlk satın alma
  | 'post_purchase'        // Satın alma sonrası
  | 'abandoned_cart'       // Terk edilen sepet
  | 'winback'              // Geri kazanım
  | 'birthday'             // Doğum günü
  | 'anniversary'          // Üyelik yıldönümü
  | 'segment_enter'        // Segment'e girdiğinde
  | 'segment_exit'         // Segment'ten çıktığında
  | 'custom'               // Özel trigger

export type EmailTrigger = {
  type: EmailTriggerType
  name: { tr: string; en: string }
  description: { tr: string; en: string }
  icon: string
  conditions?: TriggerCondition[]
}

export type TriggerCondition = {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains'
  value: string | number | boolean
}

// =====================================================
// EMAIL STEP / FLOW
// =====================================================

export type EmailStep = {
  id: string
  order: number

  // Zamanlama
  delayValue: number
  delayUnit: 'minutes' | 'hours' | 'days'

  // Email içeriği
  subject: string
  templateId: string
  templateVariables?: Record<string, string>

  // A/B Test
  abTest?: {
    enabled: boolean
    variants: {
      id: string
      subject: string
      templateId: string
      weight: number // 0-100
    }[]
  }

  // Koşullar (bu adım için)
  conditions?: StepCondition[]

  // Meta
  isActive: boolean
}

export type StepCondition = {
  type: 'email_opened' | 'email_clicked' | 'purchased' | 'custom'
  previousStepId?: string
  value?: boolean
  skipIfTrue?: boolean
}

export type EmailFlow = {
  id: string
  name: string
  description: string

  // Trigger
  trigger: EmailTrigger

  // Steps
  steps: EmailStep[]

  // Durum
  isActive: boolean
  isDraft: boolean

  // İstatistikler (cache)
  stats?: FlowStats

  // Meta
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

export type FlowStats = {
  totalSent: number
  totalOpened: number
  totalClicked: number
  totalConverted: number
  openRate: number
  clickRate: number
  conversionRate: number
  lastCalculated: string
}

// =====================================================
// EMAIL LOG / TRACKING
// =====================================================

export type EmailLogStatus =
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'unsubscribed'

export type EmailLog = {
  id: string

  // İlişkiler
  flowId: string
  stepId: string
  customerId: string
  customerEmail: string

  // Email detayları
  subject: string
  templateId: string
  abVariantId?: string

  // Durum
  status: EmailLogStatus

  // Tracking
  sentAt: string | null
  deliveredAt: string | null
  openedAt: string | null
  clickedAt: string | null
  clicks: { url: string; timestamp: string }[]

  // Hata
  errorMessage?: string

  // Meta
  createdAt: string
}

// =====================================================
// QUEUE (Zamanlanmış emailler)
// =====================================================

export type EmailQueueItem = {
  id: string

  // İlişkiler
  flowId: string
  stepId: string
  customerId: string
  customerEmail: string

  // Zamanlama
  scheduledAt: string

  // Email içeriği
  subject: string
  templateId: string
  templateVariables: Record<string, any>
  abVariantId?: string

  // Durum
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
  attempts: number
  lastAttemptAt: string | null
  errorMessage?: string

  // Meta
  createdAt: string
}

// =====================================================
// AUTOMATION CONFIG
// =====================================================

export type EmailAutomationConfig = {
  // Feature flags
  enabled: boolean

  // Genel ayarlar
  defaultFromName: string
  defaultFromEmail: string
  defaultReplyTo: string

  // Limitler
  maxEmailsPerDay: number
  maxEmailsPerCustomerPerDay: number
  minDelayBetweenEmails: number // dakika

  // Çalışma saatleri
  workingHours: {
    enabled: boolean
    startHour: number // 0-23
    endHour: number   // 0-23
    timezone: string
  }

  // Unsubscribe
  unsubscribeEnabled: boolean
  unsubscribeUrl: string

  // Aktif flowlar
  activeFlows: string[]

  // Meta
  updatedAt: string
  updatedBy: string | null
}

// =====================================================
// DEFAULT CONFIG
// =====================================================

export const DEFAULT_EMAIL_AUTOMATION_CONFIG: EmailAutomationConfig = {
  enabled: true,
  defaultFromName: 'Sade Chocolate',
  defaultFromEmail: 'merhaba@sadechocolate.com',
  defaultReplyTo: 'merhaba@sadechocolate.com',
  maxEmailsPerDay: 1000,
  maxEmailsPerCustomerPerDay: 3,
  minDelayBetweenEmails: 60,
  workingHours: {
    enabled: true,
    startHour: 9,
    endHour: 21,
    timezone: 'Europe/Istanbul'
  },
  unsubscribeEnabled: true,
  unsubscribeUrl: 'https://sadechocolate.com/unsubscribe',
  activeFlows: [],
  updatedAt: new Date().toISOString(),
  updatedBy: null
}

// =====================================================
// TRIGGER DEFINITIONS
// =====================================================

export const EMAIL_TRIGGERS: EmailTrigger[] = [
  {
    type: 'welcome',
    name: { tr: 'Hoşgeldin', en: 'Welcome' },
    description: { tr: 'Yeni üye kaydı sonrası', en: 'After new registration' },
    icon: 'user-plus'
  },
  {
    type: 'first_purchase',
    name: { tr: 'İlk Satın Alma', en: 'First Purchase' },
    description: { tr: 'İlk sipariş tamamlandığında', en: 'When first order is completed' },
    icon: 'shopping-bag'
  },
  {
    type: 'post_purchase',
    name: { tr: 'Satın Alma Sonrası', en: 'Post Purchase' },
    description: { tr: 'Her sipariş sonrası', en: 'After every order' },
    icon: 'package'
  },
  {
    type: 'abandoned_cart',
    name: { tr: 'Terk Edilen Sepet', en: 'Abandoned Cart' },
    description: { tr: 'Sepet bırakıldığında', en: 'When cart is abandoned' },
    icon: 'shopping-cart'
  },
  {
    type: 'winback',
    name: { tr: 'Geri Kazanım', en: 'Win-back' },
    description: { tr: 'İnaktif müşteriler için', en: 'For inactive customers' },
    icon: 'heart'
  },
  {
    type: 'birthday',
    name: { tr: 'Doğum Günü', en: 'Birthday' },
    description: { tr: 'Müşteri doğum gününde', en: 'On customer birthday' },
    icon: 'gift'
  },
  {
    type: 'anniversary',
    name: { tr: 'Yıldönümü', en: 'Anniversary' },
    description: { tr: 'Üyelik yıldönümünde', en: 'On membership anniversary' },
    icon: 'calendar'
  },
  {
    type: 'segment_enter',
    name: { tr: 'Segment Girişi', en: 'Segment Entry' },
    description: { tr: 'Belirli segmente girdiğinde', en: 'When entering a segment' },
    icon: 'users'
  },
  {
    type: 'segment_exit',
    name: { tr: 'Segment Çıkışı', en: 'Segment Exit' },
    description: { tr: 'Belirli segmentten çıktığında', en: 'When leaving a segment' },
    icon: 'user-minus'
  },
  {
    type: 'custom',
    name: { tr: 'Özel Trigger', en: 'Custom Trigger' },
    description: { tr: 'Manuel veya API ile tetikleme', en: 'Manual or API trigger' },
    icon: 'zap'
  }
]

// =====================================================
// DEFAULT FLOWS (Önceden tanımlı akışlar)
// =====================================================

export const DEFAULT_FLOWS: Partial<EmailFlow>[] = [
  {
    id: 'welcome-series',
    name: 'Hoşgeldin Serisi',
    description: 'Yeni üyeler için 3 emaillik tanıtım serisi',
    trigger: EMAIL_TRIGGERS.find(t => t.type === 'welcome')!,
    steps: [
      {
        id: 'welcome-1',
        order: 1,
        delayValue: 0,
        delayUnit: 'minutes',
        subject: 'Sade Chocolate Ailesine Hoşgeldin! 🍫',
        templateId: 'welcome-1',
        isActive: true
      },
      {
        id: 'welcome-2',
        order: 2,
        delayValue: 3,
        delayUnit: 'days',
        subject: 'Hikayemizi Keşfedin',
        templateId: 'welcome-2',
        isActive: true
      },
      {
        id: 'welcome-3',
        order: 3,
        delayValue: 7,
        delayUnit: 'days',
        subject: 'En Çok Sevilenler 💝',
        templateId: 'welcome-3',
        isActive: true
      }
    ],
    isActive: false,
    isDraft: true
  },
  {
    id: 'post-purchase',
    name: 'Satın Alma Sonrası',
    description: 'Sipariş sonrası memnuniyet ve yorum isteme',
    trigger: EMAIL_TRIGGERS.find(t => t.type === 'post_purchase')!,
    steps: [
      {
        id: 'post-1',
        order: 1,
        delayValue: 3,
        delayUnit: 'days',
        subject: 'Siparişinizden Memnun Kaldınız mı?',
        templateId: 'post-purchase-satisfaction',
        isActive: true
      },
      {
        id: 'post-2',
        order: 2,
        delayValue: 14,
        delayUnit: 'days',
        subject: 'Deneyiminizi Paylaşın ⭐',
        templateId: 'post-purchase-review',
        isActive: true
      }
    ],
    isActive: false,
    isDraft: true
  },
  {
    id: 'winback',
    name: 'Geri Kazanım',
    description: 'İnaktif müşterileri geri kazanma',
    trigger: EMAIL_TRIGGERS.find(t => t.type === 'winback')!,
    steps: [
      {
        id: 'winback-1',
        order: 1,
        delayValue: 30,
        delayUnit: 'days',
        subject: 'Sizi Özledik! 💔',
        templateId: 'winback-30',
        isActive: true
      },
      {
        id: 'winback-2',
        order: 2,
        delayValue: 60,
        delayUnit: 'days',
        subject: 'Son Şansınız: Özel %20 İndirim',
        templateId: 'winback-60',
        isActive: true
      }
    ],
    isActive: false,
    isDraft: true
  }
]

// =====================================================
// HELPERS
// =====================================================

export function getTriggerByType(type: EmailTriggerType): EmailTrigger | undefined {
  return EMAIL_TRIGGERS.find(t => t.type === type)
}

export function calculateDelayMs(value: number, unit: 'minutes' | 'hours' | 'days'): number {
  switch (unit) {
    case 'minutes': return value * 60 * 1000
    case 'hours': return value * 60 * 60 * 1000
    case 'days': return value * 24 * 60 * 60 * 1000
    default: return value * 60 * 1000
  }
}

export function formatDelay(value: number, unit: 'minutes' | 'hours' | 'days'): string {
  const labels: Record<string, { singular: string; plural: string }> = {
    minutes: { singular: 'dakika', plural: 'dakika' },
    hours: { singular: 'saat', plural: 'saat' },
    days: { singular: 'gün', plural: 'gün' }
  }

  if (value === 0) return 'Hemen'
  return `${value} ${value === 1 ? labels[unit].singular : labels[unit].plural} sonra`
}

export function getStatusColor(status: EmailLogStatus): string {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-700'
    case 'sent': return 'bg-slate-100 text-slate-700'
    case 'delivered': return 'bg-emerald-100 text-emerald-700'
    case 'opened': return 'bg-green-100 text-green-700'
    case 'clicked': return 'bg-purple-100 text-purple-700'
    case 'bounced': return 'bg-amber-100 text-amber-700'
    case 'failed': return 'bg-red-100 text-red-700'
    case 'unsubscribed': return 'bg-slate-100 text-slate-500'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export function getStatusLabel(status: EmailLogStatus): string {
  const labels: Record<EmailLogStatus, string> = {
    scheduled: 'Planlandı',
    sent: 'Gönderildi',
    delivered: 'Teslim Edildi',
    opened: 'Açıldı',
    clicked: 'Tıklandı',
    bounced: 'Geri Döndü',
    failed: 'Başarısız',
    unsubscribed: 'Abonelik İptal'
  }
  return labels[status] || status
}
