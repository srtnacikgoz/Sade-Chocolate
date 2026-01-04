/**
 * Email Service - Premium Templates
 * Firebase Extensions "Trigger Email" ile çalışır
 *
 * Kurulum:
 * 1. Firebase Console → Extensions → "Trigger Email" yükle
 * 2. SendGrid API key ekle (ücretsiz 100 email/gün)
 * 3. Collection: "mail" olarak ayarla
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const MAIL_COLLECTION = 'mail';

// Marka renkleri
const COLORS = {
  primary: '#4B3832',      // Koyu kahve
  gold: '#C5A059',         // Altın
  cream: '#FDFCF0',        // Krem arka plan
  text: '#333333',         // Koyu gri metin
  lightText: '#666666',    // Açık gri metin
  border: '#E8E4DC',       // Sınır rengi
};

// Ortak email footer
const getEmailFooter = (email: string) => `
  <div style="background: ${COLORS.cream}; padding: 40px 20px; text-align: center; border-top: 1px solid ${COLORS.border};">
    <!-- Sosyal Medya -->
    <div style="margin-bottom: 24px;">
      <a href="https://instagram.com/sadechocolate" style="display: inline-block; margin: 0 8px; color: ${COLORS.primary}; text-decoration: none;">
        <img src="https://sadechocolate.com/icons/instagram.png" alt="Instagram" width="24" height="24" style="opacity: 0.7;">
      </a>
      <a href="https://facebook.com/sadechocolate" style="display: inline-block; margin: 0 8px; color: ${COLORS.primary}; text-decoration: none;">
        <img src="https://sadechocolate.com/icons/facebook.png" alt="Facebook" width="24" height="24" style="opacity: 0.7;">
      </a>
    </div>

    <!-- Adres -->
    <p style="font-family: Georgia, serif; font-size: 12px; color: ${COLORS.lightText}; margin: 0 0 8px; line-height: 1.6;">
      Sade Chocolate<br>
      Yeşilbahçe Mah. Çınarlı Cd. 47/A<br>
      Muratpaşa, Antalya 07160
    </p>

    <!-- İletişim -->
    <p style="font-family: Georgia, serif; font-size: 12px; color: ${COLORS.lightText}; margin: 16px 0;">
      Sorularınız için: <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.gold}; text-decoration: none;">bilgi@sadechocolate.com</a>
    </p>

    <!-- Tercih Yönetimi -->
    <p style="font-family: Georgia, serif; font-size: 11px; color: #999; margin: 16px 0 0;">
      Bu email ${email} adresine gönderilmiştir.<br>
      <a href="https://sadechocolate.com/#/account" style="color: ${COLORS.gold}; text-decoration: none;">Email tercihlerini yönet</a>
    </p>

    <!-- Copyright -->
    <p style="font-family: Georgia, serif; font-size: 11px; color: #999; margin: 16px 0 0;">
      © 2026 Sade Chocolate. Tüm hakları saklıdır.
    </p>
  </div>
`;

// Ortak email header
const getEmailHeader = (badge?: string) => `
  <div style="background: ${COLORS.primary}; padding: 48px 20px; text-align: center;">
    <!-- Logo -->
    <h1 style="font-family: Georgia, serif; font-size: 42px; color: white; margin: 0; font-weight: normal; letter-spacing: 3px;">Sade</h1>
    <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.gold}; margin: 8px 0 0; letter-spacing: 2px;">Chocolate</p>
    ${badge ? `
    <div style="display: inline-block; background: ${COLORS.gold}; color: ${COLORS.primary}; padding: 10px 24px; border-radius: 30px; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-top: 20px; text-transform: uppercase;">
      ${badge}
    </div>
    ` : ''}
  </div>
`;

// Email wrapper
const wrapEmail = (content: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sade Chocolate</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${COLORS.cream}; font-family: Georgia, serif;">
    <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
      ${content}
    </div>
  </body>
  </html>
`;

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Genel email gönderme fonksiyonu
 */
const sendEmail = async (emailData: EmailData) => {
  try {
    await addDoc(collection(db, MAIL_COLLECTION), {
      to: emailData.to,
      message: {
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || ''
      },
      createdAt: serverTimestamp()
    });
    console.log('📧 Email kuyruğa eklendi:', emailData.to);
    return true;
  } catch (error) {
    console.error('❌ Email gönderilemedi:', error);
    return false;
  }
};

/**
 * Hoş Geldin Emaili - Premium Template
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName: string
) => {
  const content = `
    ${getEmailHeader()}

    <!-- Hero Image -->
    <div style="background: linear-gradient(135deg, ${COLORS.cream} 0%, #F5F0E6 100%); padding: 40px 20px; text-align: center;">
      <img src="https://sadechocolate.com/images/welcome-hero.jpg" alt="Artisan Çikolata" style="max-width: 100%; height: auto; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.1);" onerror="this.style.display='none'">
    </div>

    <!-- Content -->
    <div style="padding: 48px 40px;">
      <!-- Greeting -->
      <h1 style="font-family: Georgia, serif; font-size: 32px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
        Hoş Geldin, ${firstName}!
      </h1>
      <div style="width: 60px; height: 2px; background: ${COLORS.gold}; margin: 16px 0 24px;"></div>

      <!-- Message -->
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 20px;">
        Sade Chocolate ailesine katıldığın için çok mutluyuz.
      </p>
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 20px;">
        Artık <strong style="color: ${COLORS.gold};">bean-to-bar</strong> çikolata dünyasının kapıları sana açık. Her bir tabletimiz, özenle seçilmiş kakao çekirdeklerinden, geleneksel yöntemlerle üretiliyor.
      </p>

      <!-- Features -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin: 32px 0;">
        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 12px; text-align: center; width: 33%;">
              <div style="font-size: 24px; margin-bottom: 8px;">🌱</div>
              <div style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.primary}; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Tek Menşei</div>
            </td>
            <td style="padding: 12px; text-align: center; width: 33%;">
              <div style="font-size: 24px; margin-bottom: 8px;">🍫</div>
              <div style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.primary}; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">El Yapımı</div>
            </td>
            <td style="padding: 12px; text-align: center; width: 33%;">
              <div style="font-size: 24px; margin-bottom: 8px;">✨</div>
              <div style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.primary}; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">%100 Doğal</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="https://sadechocolate.com/#/catalog" style="display: inline-block; background: ${COLORS.primary}; color: white; padding: 18px 48px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(75,56,50,0.3);">
          Koleksiyonu Keşfet
        </a>
      </div>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `Hoş Geldin, ${firstName}!`,
    html: wrapEmail(content),
    text: `Hoş Geldin ${firstName}! Sade Chocolate ailesine katıldığın için çok mutluyuz. Koleksiyonumuzu keşfet: https://sadechocolate.com/#/catalog`
  });
};

/**
 * Sipariş Onay Emaili - Premium Template
 */
export const sendOrderConfirmationEmail = async (
  email: string,
  orderData: {
    orderId: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    shipping: number;
    total: number;
    address: string;
  }
) => {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 16px 12px; border-bottom: 1px solid ${COLORS.border}; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text};">
        ${item.name}
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.lightText};">
        ${item.quantity}
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; font-weight: bold;">
        ₺${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const content = `
    ${getEmailHeader('Sipariş Onaylandı')}

    <!-- Content -->
    <div style="padding: 48px 40px;">
      <!-- Greeting -->
      <h1 style="font-family: Georgia, serif; font-size: 28px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
        Teşekkürler, ${orderData.customerName}!
      </h1>
      <p style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.gold}; margin: 0 0 24px; letter-spacing: 1px;">
        Sipariş No: #${orderData.orderId}
      </p>

      <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; line-height: 1.7; margin: 0 0 32px;">
        Siparişiniz başarıyla alındı. En kısa sürede özenle hazırlanıp kargoya verilecektir.
      </p>

      <!-- Order Items -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.primary}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
          Sipariş Detayı
        </h3>
        <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
          <thead>
            <tr>
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase; letter-spacing: 1px;">Ürün</th>
              <th style="text-align: center; padding: 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase; letter-spacing: 1px;">Adet</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase; letter-spacing: 1px;">Fiyat</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="background: ${COLORS.primary}; border-radius: 16px; padding: 24px; color: white;">
        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 8px 0;">Ara Toplam</td>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 8px 0; text-align: right;">₺${orderData.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 8px 0;">Kargo</td>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 8px 0; text-align: right;">${orderData.shipping === 0 ? 'Ücretsiz' : '₺' + orderData.shipping.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 16px 0 8px;"><div style="border-top: 1px solid rgba(255,255,255,0.2);"></div></td>
          </tr>
          <tr>
            <td style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: ${COLORS.gold};">Toplam</td>
            <td style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; text-align: right; color: ${COLORS.gold};">₺${orderData.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Delivery Address -->
      ${orderData.address ? `
      <div style="margin-top: 24px; padding: 24px; border: 1px solid ${COLORS.border}; border-radius: 16px;">
        <h3 style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.lightText}; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px;">
          Teslimat Adresi
        </h3>
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; margin: 0; line-height: 1.6;">
          ${orderData.address}
        </p>
      </div>
      ` : ''}

      <!-- Track Order CTA -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="https://sadechocolate.com/#/account" style="display: inline-block; background: ${COLORS.gold}; color: ${COLORS.primary}; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          Siparişi Takip Et
        </a>
      </div>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `Siparişiniz Onaylandı! #${orderData.orderId}`,
    html: wrapEmail(content),
    text: `Siparişiniz onaylandı! Sipariş No: #${orderData.orderId}. Toplam: ₺${orderData.total.toFixed(2)}`
  });
};

/**
 * Kargo Bildirim Emaili - Premium Template
 */
export const sendShippingNotificationEmail = async (
  email: string,
  data: {
    customerName: string;
    orderId: string;
    trackingNumber: string;
    carrierName: string;
    trackingUrl?: string;
  }
) => {
  const content = `
    ${getEmailHeader('Kargoya Verildi')}

    <!-- Content -->
    <div style="padding: 48px 40px; text-align: center;">
      <!-- Icon -->
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(34,197,94,0.3);">
        <span style="font-size: 36px;">📦</span>
      </div>

      <!-- Title -->
      <h1 style="font-family: Georgia, serif; font-size: 28px; color: ${COLORS.primary}; margin: 0 0 16px; font-weight: normal; font-style: italic;">
        Siparişin Yola Çıktı!
      </h1>
      <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; line-height: 1.7; margin: 0 0 32px;">
        Merhaba ${data.customerName}, <strong style="color: ${COLORS.gold};">#${data.orderId}</strong> numaralı siparişin kargoya verildi.
      </p>

      <!-- Tracking Box -->
      <div style="background: ${COLORS.cream}; border-radius: 20px; padding: 32px; margin: 0 0 32px;">
        <p style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.lightText}; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px;">
          Takip Numarası
        </p>
        <p style="font-family: 'Courier New', monospace; font-size: 28px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: bold; letter-spacing: 4px;">
          ${data.trackingNumber}
        </p>
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.gold}; margin: 0;">
          ${data.carrierName}
        </p>
      </div>

      <!-- CTA Button -->
      ${data.trackingUrl ? `
      <a href="${data.trackingUrl}" style="display: inline-block; background: ${COLORS.primary}; color: white; padding: 18px 48px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(75,56,50,0.3);">
        Kargoyu Takip Et
      </a>
      ` : ''}

      <!-- Delivery Info -->
      <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid ${COLORS.border};">
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.lightText}; margin: 0;">
          Tahmini teslimat süresi: <strong style="color: ${COLORS.primary};">1-3 iş günü</strong>
        </p>
      </div>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `Siparişiniz Kargoya Verildi!`,
    html: wrapEmail(content),
    text: `Siparişiniz kargoya verildi! Takip No: ${data.trackingNumber} (${data.carrierName})`
  });
};

/**
 * Newsletter Abonelik Hoş Geldin Emaili - Minimalist Luxury Template
 * Template içeriği Firestore'dan çekilir (email_templates/newsletter_welcome)
 */
export const sendNewsletterWelcomeEmail = async (email: string) => {
  // Firestore'dan template ayarlarını çek
  let t = {
    headerBadge: '✦ Hoş Geldin ✦',
    mainTitle: 'Artisan Çikolata\nDünyasına Adım Attın',
    welcomeText: 'Bundan sonra yeni koleksiyonlar, özel teklifler ve bean-to-bar dünyasından hikayeler seninle.',
    discountEnabled: true,
    discountLabel: 'İlk Siparişine Özel',
    discountPercent: 10,
    discountCode: 'HOSGELDIN10',
    benefit1Title: 'Koleksiyonlar',
    benefit1Text: 'Tek menşei kakao çekirdeklerinden üretilen sezonluk ve limitli seriler',
    benefit2Title: 'Ayrıcalıklar',
    benefit2Text: 'Abonelere özel erken erişim, indirimler ve sürpriz hediyeler',
    ctaText: 'Koleksiyonu Keşfet',
    ctaUrl: 'https://sadechocolate.com/#/catalog',
    emailSubject: 'Hoş Geldin — İlk Siparişine %10 İndirim',
    colors: {
      headerBg: '#4B3832',
      bodyBg: '#FDFCF8',
      outerBg: '#E8E4DC',
      accent: '#C5A059',
      textPrimary: '#4B3832',
      textSecondary: '#666666'
    }
  };

  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const templateDoc = await getDoc(doc(db, 'email_templates', 'newsletter_welcome'));
    if (templateDoc.exists()) {
      t = { ...t, ...templateDoc.data() };
    }
  } catch (error) {
    console.warn('Template Firestore\'dan yüklenemedi, varsayılan değerler kullanılıyor:', error);
  }

  const c = t.colors;
  const mainTitleHTML = t.mainTitle.replace(/\n/g, '<br>');

  // İndirim bölümü HTML'i
  const discountSectionHTML = t.discountEnabled ? `
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${c.headerBg}; margin-bottom: 48px;">
                    <tr>
                      <td style="padding: 40px 32px; text-align: center;">
                        <p style="margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 3px; color: ${c.accent}; text-transform: uppercase;">
                          ${t.discountLabel}
                        </p>
                        <p style="margin: 0 0 4px; font-family: Georgia, serif; font-size: 64px; font-weight: normal; color: ${c.bodyBg}; line-height: 1;">
                          %${t.discountPercent}
                        </p>
                        <p style="margin: 0 0 24px; font-family: Georgia, serif; font-size: 16px; font-style: italic; color: ${c.accent};">
                          indirim
                        </p>
                        <div style="display: inline-block; border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px;">
                          <p style="margin: 0 0 4px; font-family: Arial, sans-serif; font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.5); text-transform: uppercase;">
                            Kod
                          </p>
                          <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 20px; letter-spacing: 4px; color: ${c.bodyBg}; font-weight: bold;">
                            ${t.discountCode}
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
  ` : '';

  const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sade Chocolate - Bültene Hoş Geldin</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${c.outerBg}; font-family: Georgia, 'Times New Roman', serif;">

      <!-- Outer Container -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${c.outerBg}; padding: 40px 20px;">
        <tr>
          <td align="center">

            <!-- Email Container with Shadow Effect -->
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${c.bodyBg}; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header Band -->
              <tr>
                <td style="background-color: ${c.headerBg}; padding: 40px 48px; text-align: center;">
                  <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal; letter-spacing: 6px; color: ${c.bodyBg};">SADE</h1>
                  <p style="margin: 8px 0 0; font-family: Georgia, serif; font-size: 11px; letter-spacing: 4px; color: ${c.accent}; text-transform: uppercase;">Chocolate</p>
                </td>
              </tr>

              <!-- Main Content Area -->
              <tr>
                <td style="background-color: ${c.bodyBg}; padding: 60px 48px;">

                  <!-- Welcome Badge -->
                  <p style="text-align: center; margin: 0 0 16px; font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 3px; color: ${c.accent}; text-transform: uppercase;">
                    ${t.headerBadge}
                  </p>

                  <!-- Main Title -->
                  <h2 style="text-align: center; margin: 0 0 32px; font-family: Georgia, serif; font-size: 32px; font-weight: normal; font-style: italic; color: ${c.textPrimary}; line-height: 1.3;">
                    ${mainTitleHTML}
                  </h2>

                  <!-- Divider -->
                  <div style="width: 60px; height: 1px; background-color: ${c.accent}; margin: 0 auto 32px;"></div>

                  <!-- Welcome Text -->
                  <p style="text-align: center; margin: 0 0 48px; font-family: Georgia, serif; font-size: 15px; line-height: 1.8; color: ${c.textSecondary};">
                    ${t.welcomeText}
                  </p>

                  <!-- Discount Section -->
                  ${discountSectionHTML}

                  <!-- Two Column Benefits -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 48px;">
                    <tr>
                      <td width="48%" valign="top" style="padding-right: 16px;">
                        <p style="margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 9px; letter-spacing: 2px; color: ${c.accent}; text-transform: uppercase;">
                          ${t.benefit1Title}
                        </p>
                        <p style="margin: 0; font-family: Georgia, serif; font-size: 13px; line-height: 1.6; color: ${c.textSecondary};">
                          ${t.benefit1Text}
                        </p>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" valign="top" style="padding-left: 16px;">
                        <p style="margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 9px; letter-spacing: 2px; color: ${c.accent}; text-transform: uppercase;">
                          ${t.benefit2Title}
                        </p>
                        <p style="margin: 0; font-family: Georgia, serif; font-size: 13px; line-height: 1.6; color: ${c.textSecondary};">
                          ${t.benefit2Text}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${t.ctaUrl}" style="display: inline-block; background-color: ${c.headerBg}; color: ${c.bodyBg}; padding: 16px 48px; text-decoration: none; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
                          ${t.ctaText}
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #F5F3EF; padding: 32px 48px; text-align: center; border-top: 1px solid ${c.outerBg};">
                  <p style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 14px; color: ${c.textPrimary};">
                    Sade Chocolate
                  </p>
                  <p style="margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 11px; color: #999999; line-height: 1.6;">
                    Yeşilbahçe Mah. Çınarlı Cd. 47/A<br>
                    Muratpaşa, Antalya 07160
                  </p>
                  <p style="margin: 16px 0 0; font-family: Arial, sans-serif; font-size: 10px; color: #BBBBBB;">
                    Bu email ${email} adresine gönderilmiştir.<br>
                    <a href="https://sadechocolate.com/#/account" style="color: #C5A059; text-decoration: none;">Email tercihlerini yönet</a>
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: t.emailSubject,
    html: template,
    text: `Sade Chocolate bültenine hoş geldin!${t.discountEnabled ? ` İlk siparişinde %${t.discountPercent} indirim için ${t.discountCode} kodunu kullan.` : ''} Koleksiyonu keşfet: ${t.ctaUrl}`
  });
};
