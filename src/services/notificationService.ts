import { Order } from '../components/admin/tabs/OrdersTab';
import { getNotificationTemplate, getProactiveNotification, NotificationType } from './notificationTemplates';
import { calculateEstimatedDeliveryDate } from '../utils/estimatedDelivery';

/**
 * Bildirim Kanalları
 */
export interface NotificationChannel {
  type: NotificationType;
  enabled: boolean;
  priority: number; // 1 = yüksek, 3 = düşük
}

/**
 * Bildirim Gönderim Sonucu
 */
export interface NotificationResult {
  success: boolean;
  channel: NotificationType;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

/**
 * Bildirim Servisi Konfigürasyonu
 */
export interface NotificationConfig {
  channels: NotificationChannel[];
  autoSendOnStatusChange: boolean;
  batchNotifications: boolean; // Toplu bildirim gönderimi
  retryOnFailure: boolean;
  maxRetries: number;
}

/**
 * Varsayılan Konfigürasyon
 */
const defaultConfig: NotificationConfig = {
  channels: [
    { type: 'whatsapp', enabled: true, priority: 1 },
    { type: 'sms', enabled: true, priority: 2 },
    { type: 'email', enabled: true, priority: 3 },
  ],
  autoSendOnStatusChange: true,
  batchNotifications: false,
  retryOnFailure: true,
  maxRetries: 3,
};

/**
 * Bildirim Servisi
 *
 * GERÇEK UYGULAMADA:
 * - WhatsApp Business API entegrasyonu (Twilio, MessageBird, vb.)
 * - SMS servisi (Twilio, Netgsm, İleti Merkezi, vb.)
 * - Email servisi (SendGrid, AWS SES, Mailgun, vb.)
 */
class NotificationService {
  private config: NotificationConfig;
  private sentNotifications: Map<string, NotificationResult[]> = new Map();

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Sipariş durumu değişikliğinde otomatik bildirim gönder
   */
  async sendOrderStatusNotification(
    order: Order,
    previousStatus?: Order['status']
  ): Promise<NotificationResult[]> {
    if (!this.config.autoSendOnStatusChange) {
      return [];
    }

    const results: NotificationResult[] = [];
    const edd = calculateEstimatedDeliveryDate(order);

    // Aktif kanalları önceliğe göre sırala
    const activeChannels = this.config.channels
      .filter((ch) => ch.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const channel of activeChannels) {
      try {
        const template = getNotificationTemplate(order, channel.type, edd);

        if (!template) {
          continue;
        }

        const result = await this.sendNotification(
          order.customerInfo,
          channel.type,
          template,
          order.id
        );

        results.push(result);

        // İlk başarılı gönderimden sonra diğer kanalları atla (opsiyonel)
        if (result.success && !this.config.batchNotifications) {
          break;
        }
      } catch (error) {
        results.push({
          success: false,
          channel: channel.type,
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date(),
        });
      }
    }

    // Gönderilenleri kaydet
    const existingNotifications = this.sentNotifications.get(order.id) || [];
    this.sentNotifications.set(order.id, [...existingNotifications, ...results]);

    return results;
  }

  /**
   * Proaktif bildirim gönder
   * Örn: Teslimat bugün, gecikme uyarısı, hava durumu uyarısı
   */
  async sendProactiveNotification(
    order: Order,
    scenario: 'delay' | 'weather_alert' | 'quality_check' | 'delivery_today',
    channel: NotificationType = 'whatsapp'
  ): Promise<NotificationResult> {
    const template = getProactiveNotification(order, scenario);

    if (!template) {
      throw new Error('Template not found for scenario: ' + scenario);
    }

    return this.sendNotification(
      order.customerInfo,
      channel,
      template.whatsapp || '',
      order.id
    );
  }

  /**
   * Temel bildirim gönderim fonksiyonu
   *
   * GERÇEK UYGULAMADA:
   * Bu fonksiyon ilgili API'lere istek gönderecek
   */
  private async sendNotification(
    customer: Order['customerInfo'],
    channel: NotificationType,
    message: any,
    orderId: string
  ): Promise<NotificationResult> {
    // MOCK IMPLEMENTATION - Gerçek API entegrasyonu yapılacak

    console.log(`
═══════════════════════════════════════════════
📨 NOTIFICATION SENT
═══════════════════════════════════════════════
Channel: ${channel.toUpperCase()}
To: ${customer.name}
Contact: ${channel === 'email' ? customer.email : customer.phone}
Order: #${orderId.substring(0, 8)}
Time: ${new Date().toLocaleString('tr-TR')}
───────────────────────────────────────────────
Message:
${typeof message === 'string' ? message : JSON.stringify(message, null, 2)}
═══════════════════════════════════════════════
    `);

    // Simüle edilmiş API yanıtı
    await new Promise((resolve) => setTimeout(resolve, 500));

    // %95 başarı oranı (gerçekçi simülasyon)
    const success = Math.random() > 0.05;

    if (!success && this.config.retryOnFailure) {
      // Retry logic
      for (let i = 0; i < this.config.maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (Math.random() > 0.3) {
          return {
            success: true,
            channel,
            messageId: `msg_${Date.now()}_retry${i}`,
            sentAt: new Date(),
          };
        }
      }
    }

    return {
      success,
      channel,
      messageId: success ? `msg_${Date.now()}` : undefined,
      error: success ? undefined : 'Failed to send notification',
      sentAt: new Date(),
    };
  }

  /**
   * Belirli bir sipariş için gönderilen tüm bildirimleri getir
   */
  getNotificationHistory(orderId: string): NotificationResult[] {
    return this.sentNotifications.get(orderId) || [];
  }

  /**
   * Toplu bildirim gönder
   * Örn: "Siparişiniz bugün teslim edilecek" kampanyası
   */
  async sendBulkNotification(
    orders: Order[],
    channel: NotificationType,
    customMessage?: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const order of orders) {
      try {
        const message =
          customMessage || getNotificationTemplate(order, channel, calculateEstimatedDeliveryDate(order));

        if (message) {
          const result = await this.sendNotification(
            order.customerInfo,
            channel,
            message,
            order.id
          );
          results.push(result);
        }
      } catch (error) {
        results.push({
          success: false,
          channel,
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date(),
        });
      }

      // Rate limiting - API kotalarını aşmamak için
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Konfigürasyonu güncelle
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Belirli bir kanalı aktif/pasif et
   */
  toggleChannel(channel: NotificationType, enabled: boolean): void {
    const channelConfig = this.config.channels.find((ch) => ch.type === channel);
    if (channelConfig) {
      channelConfig.enabled = enabled;
    }
  }
}

/**
 * Singleton instance
 */
export const notificationService = new NotificationService();

/**
 * Sipariş durumu değişikliği hook'u
 * Admin panelde sipariş durumu güncellendiğinde otomatik çağrılır
 */
export const onOrderStatusChange = async (
  order: Order,
  previousStatus?: Order['status']
): Promise<void> => {
  try {
    const results = await notificationService.sendOrderStatusNotification(order, previousStatus);

    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ ${successCount}/${results.length} notifications sent successfully for order #${order.id.substring(0, 8)}`);

    // Proaktif bildirimler
    if (order.status === 'shipped') {
      const edd = calculateEstimatedDeliveryDate(order);
      const hoursUntilDelivery = (edd.getTime() - new Date().getTime()) / (1000 * 60 * 60);

      // Eğer teslimat 24 saat içindeyse "Bugün teslim" bildirimi gönder
      if (hoursUntilDelivery < 24) {
        await notificationService.sendProactiveNotification(order, 'delivery_today');
      }
    }

    // Hava durumu uyarısı
    if (order.weatherAlert?.requiresIce && order.status === 'processing') {
      await notificationService.sendProactiveNotification(order, 'weather_alert');
    }
  } catch (error) {
    console.error('Error sending order status notification:', error);
  }
};

export default notificationService;
