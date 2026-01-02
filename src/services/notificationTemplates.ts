import { Order } from '../components/admin/tabs/OrdersTab';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Bildirim Türleri
 */
export type NotificationType = 'whatsapp' | 'sms' | 'email';

/**
 * Sipariş durumuna göre mesaj şablonları
 * Marka kimliğini yansıtan, kişiselleştirilmiş mesajlar
 */

export const getNotificationTemplate = (
  order: Order,
  type: NotificationType,
  estimatedDeliveryDate?: Date
) => {
  const customerName = order.customerInfo.name.split(' ')[0]; // İlk isim
  const orderId = order.id.substring(0, 8);
  const eddFormatted = estimatedDeliveryDate
    ? format(estimatedDeliveryDate, 'dd MMMM yyyy, EEEE', { locale: tr })
    : '';

  const templates = {
    pending: {
      whatsapp: `🍫 *Merhaba ${customerName}!*

Siparişiniz başarıyla alındı! ✅

📦 *Sipariş No:* #${orderId}
💰 *Tutar:* ₺${order.total.toFixed(2)}
🕐 *Tahmini Teslimat:* ${eddFormatted}

Butik üretim sürecimiz başladı. Her çikolata özenle hazırlanıyor...

Sipariş takibi için: https://sadechocolate.com/track/${order.id}

*Sade Chocolate* 🤎
"Her lokmada ustalık"`,

      sms: `Sade Chocolate: Siparişiniz (#${orderId}) alındı! Tahmini teslimat: ${eddFormatted}. Takip: https://sadechocolate.com/track/${order.id}`,

      email: {
        subject: `✅ Siparişiniz Alındı - #${orderId}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9f5f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 32px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3e2723 0%, #6d4c41 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-style: italic; }
    .header p { margin: 10px 0 0; color: #ffecb3; font-size: 14px; }
    .content { padding: 40px; }
    .status-badge { background: #fff3e0; border: 2px solid #ffb74d; color: #e65100; padding: 12px 20px; border-radius: 16px; display: inline-block; font-weight: bold; font-size: 14px; margin-bottom: 24px; }
    .info-box { background: #f5f5f5; border-radius: 16px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #757575; font-size: 14px; }
    .info-value { font-weight: bold; color: #3e2723; font-size: 14px; }
    .btn { display: inline-block; background: #3e2723; color: white; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .btn:hover { background: #1b0000; }
    .footer { background: #f5f5f5; padding: 30px; text-align: center; color: #757575; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍫 Sade Chocolate</h1>
      <p>Her lokmada ustalık</p>
    </div>
    <div class="content">
      <h2 style="color: #3e2723; margin-top: 0;">Merhaba ${customerName}! 👋</h2>

      <div class="status-badge">✅ SİPARİŞİNİZ ALINDI</div>

      <p style="color: #424242; line-height: 1.6;">
        Siparişiniz başarıyla alındı! Butik üretim sürecimiz başladı.
        Her çikolata, şeflerimiz tarafından özenle hazırlanıyor.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Sipariş No</span>
          <span class="info-value">#${orderId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ürün Sayısı</span>
          <span class="info-value">${order.items.length} adet</span>
        </div>
        <div class="info-row">
          <span class="info-label">Toplam Tutar</span>
          <span class="info-value">₺${order.total.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tahmini Teslimat</span>
          <span class="info-value">${eddFormatted}</span>
        </div>
      </div>

      ${order.weatherAlert?.requiresIce ? `
      <div style="background: #fff3e0; border: 2px solid #ff9800; border-radius: 16px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100; font-weight: bold; font-size: 14px;">
          ⚠️ Özel Paketleme: Yüksek sıcaklık nedeniyle ürününüz soğutmalı ambalajla gönderilecektir.
        </p>
      </div>
      ` : ''}

      <a href="https://sadechocolate.com/track/${order.id}" class="btn">
        📦 Siparişimi Takip Et
      </a>
    </div>
    <div class="footer">
      <p><strong>Sade Chocolate</strong><br>
      Antalya, Türkiye<br>
      📞 0242 321 12 34 | 📧 info@sadechocolate.com</p>
    </div>
  </div>
</body>
</html>
        `,
      },
    },

    processing: {
      whatsapp: `👨‍🍳 *Merhaba ${customerName}!*

Siparişiniz şu an üretim aşamasında! 🍫

📦 *Sipariş No:* #${orderId}
⏱️ *Durum:* Hazırlanıyor
🕐 *Tahmini Teslimat:* ${eddFormatted}

${order.giftDetails?.isGift ? '🎁 Özel hediye paketiniz hazırlanıyor...' : 'Butik çikolatalarınız özenle hazırlanıyor...'}

Sipariş takibi için: https://sadechocolate.com/track/${order.id}

*Sade Chocolate* 🤎`,

      sms: `Sade Chocolate: Siparişiniz (#${orderId}) hazırlanıyor! Tahmini teslimat: ${eddFormatted}`,

      email: {
        subject: `👨‍🍳 Siparişiniz Hazırlanıyor - #${orderId}`,
        html: `<!-- Similar HTML template with processing status -->`,
      },
    },

    shipped: {
      whatsapp: `🚚 *Merhaba ${customerName}!*

Harika haber! Siparişiniz kargoya verildi! 📦

📦 *Sipariş No:* #${orderId}
🚛 *Kargo:* ${order.logistics?.carrier || 'Kargo Firması'}
🔢 *Takip No:* ${order.logistics?.trackingNumber || 'Yakında eklenecek'}
🕐 *Tahmini Teslimat:* ${eddFormatted}

${order.weatherAlert?.requiresIce ? '❄️ Ürününüz soğutmalı ambalajla güvenle yolda!' : 'Ürününüz yolda!'}

Sipariş takibi için: https://sadechocolate.com/track/${order.id}

*Sade Chocolate* 🤎
"Kapınıza geliyoruz..."`,

      sms: `Sade Chocolate: Siparişiniz (#${orderId}) kargoda! ${order.logistics?.trackingNumber ? `Takip: ${order.logistics.trackingNumber}` : ''} Teslimat: ${eddFormatted}`,

      email: {
        subject: `🚚 Siparişiniz Kargoda - #${orderId}`,
        html: `<!-- Similar HTML template with shipped status -->`,
      },
    },

    delivered: {
      whatsapp: `✅ *Merhaba ${customerName}!*

Siparişiniz teslim edildi! 🎉

📦 *Sipariş No:* #${orderId}
✅ *Durum:* Teslim Edildi

Afiyet olsun! Lezzetli anlar dileriz 🍫

Deneyiminizi bizimle paylaşır mısınız?
⭐️ Değerlendirme yap: https://sadechocolate.com/review/${order.id}

*Sade Chocolate* 🤎
"Teşekkür ederiz!"`,

      sms: `Sade Chocolate: Siparişiniz (#${orderId}) teslim edildi! Afiyet olsun 🍫 Değerlendirin: https://sadechocolate.com/review/${order.id}`,

      email: {
        subject: `✅ Siparişiniz Teslim Edildi - #${orderId}`,
        html: `<!-- Similar HTML template with delivered status and review request -->`,
      },
    },

    cancelled: {
      whatsapp: `❌ *Merhaba ${customerName}*

Siparişiniz iptal edildi.

📦 *Sipariş No:* #${orderId}

Eğer bu bir hata ise veya sorularınız varsa lütfen bizimle iletişime geçin:
📞 0242 321 12 34

*Sade Chocolate* 🤎`,

      sms: `Sade Chocolate: Siparişiniz (#${orderId}) iptal edildi. Sorularınız için: 0242 321 12 34`,

      email: {
        subject: `Sipariş İptal Edildi - #${orderId}`,
        html: `<!-- Similar HTML template with cancellation notice -->`,
      },
    },
  };

  return templates[order.status]?.[type];
};

/**
 * Proaktif bildirim şablonları
 * WISMO kaygısını azaltmak için önceden bilgilendirme
 */

export const getProactiveNotification = (
  order: Order,
  scenario: 'delay' | 'weather_alert' | 'quality_check' | 'delivery_today'
) => {
  const customerName = order.customerInfo.name.split(' ')[0];
  const orderId = order.id.substring(0, 8);

  const scenarios = {
    delay: {
      whatsapp: `⏱️ *Merhaba ${customerName}*

Siparişiniz (#${orderId}) hakkında bilgilendirme:

Yüksek talep nedeniyle teslimat sürenizde 1-2 günlük gecikme beklenebilir. Ekstra özen gösteriyoruz ve ürün kalitenizden ödün vermiyoruz.

Anlayışınız için teşekkür ederiz 🙏

*Sade Chocolate* 🤎`,
    },

    weather_alert: {
      whatsapp: `🌡️ *Merhaba ${customerName}*

Teslimat bölgenizde yüksek sıcaklık tespit edildi!

📦 Siparişiniz (#${orderId}) özel soğutmalı ambalajla gönderilecek. Ürün kalitesi garanti altında! ❄️

*Sade Chocolate* 🤎`,
    },

    quality_check: {
      whatsapp: `✅ *Kalite Kontrolü Tamamlandı*

${customerName}, siparişiniz (#${orderId}) son kalite kontrolünden geçti!

👨‍🍳 Şef onayı alındı
📦 Paketleme tamamlandı
🚚 Bugün kargoya verilecek

*Sade Chocolate* 🤎`,
    },

    delivery_today: {
      whatsapp: `🚀 *Bugün Teslim!*

${customerName}, müjde! Siparişiniz (#${orderId}) bugün size ulaşacak! 📦

Lütfen teslimat adresinizde olduğunuzdan emin olun.

*Sade Chocolate* 🤎`,
    },
  };

  return scenarios[scenario];
};
