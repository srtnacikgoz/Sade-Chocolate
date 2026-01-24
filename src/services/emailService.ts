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

// Yeni Premium Marka Renkleri
const COLORS = {
  bg: '#F3F0EB',           // Dış arka plan (Sıcak gri/bej)
  card: '#FFFEFA',         // Kart arka planı (Sıcak beyaz)
  text: '#2C1810',         // Ana metin (Derin kahve)
  gold: '#D4AF37',         // Altın vurgu
  gray: '#8A817C',         // Açık gri metin
  divider: '#EBE5D9',      // Ayırıcı çizgi
  footerBg: '#2C1810',     // Footer arka planı (Koyu kahve)
  footerText: '#EBE5D9',   // Footer metin
};

// Ortak email header - Minimal & Elegant
const getEmailHeader = () => `
  <!-- Top Border Accent -->
  <div style="height: 4px; background-color: ${COLORS.text}; width: 100%;"></div>

  <!-- Branding Header -->
  <div style="padding: 50px 0 30px; text-align: center;">
    <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 48px; color: ${COLORS.text}; margin: 0; font-style: italic; letter-spacing: -1px;">Sade</h1>
    <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 4px; color: ${COLORS.gold}; margin-top: 5px; font-weight: 600;">Artisan Chocolate</p>
  </div>

  <!-- Divider -->
  <div style="width: 40px; height: 1px; background-color: ${COLORS.gold}; margin: 0 auto 40px;"></div>
`;

// Atmospheric footer section - Koyu arka plan
const getAtmosphericFooter = () => `
  <div style="background-color: ${COLORS.footerBg}; color: #fff; padding: 50px; text-align: center; position: relative; overflow: hidden;">
    <!-- Decorative Circle -->
    <div style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 100px; height: 100px; background-color: ${COLORS.gold}; border-radius: 50%; opacity: 0.1;"></div>

    <h4 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-style: italic; margin: 0 0 15px 0; color: ${COLORS.gold};">Sade Deneyimi</h4>
    <p style="font-size: 13px; line-height: 1.7; color: ${COLORS.footerText}; max-width: 400px; margin: 0 auto; font-weight: 300;">
      Ürünleriniz, Antalya'daki atölyemizden özel ısı yalıtımlı "Sade" kutularında, soğuk zincir bozulmadan tarafınıza ulaştırılacaktır.
    </p>
  </div>
`;

// Minimal footer links
const getEmailFooter = () => `
  ${getAtmosphericFooter()}

  <div style="background-color: ${COLORS.bg}; padding: 30px; text-align: center;">
    <p style="font-size: 10px; color: #A09890; margin: 0 0 15px 0; letter-spacing: 1px; text-transform: uppercase;">
      Yeşilbahçe Mah. Çınarlı Cad. No:47, Antalya
    </p>
    <div style="font-size: 11px;">
      <a href="https://sadechocolate.com/#/account" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Hesabım</a>
      <a href="https://sadechocolate.com/#/catalog" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Koleksiyonlar</a>
      <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">İletişim</a>
    </div>
    <p style="font-size: 10px; color: #BDB6B0; margin-top: 20px;">© 2026 Sade Chocolate. All rights reserved.</p>
  </div>
`;

// Email wrapper - Yeni stil
const wrapEmail = (content: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sade Chocolate</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${COLORS.bg}; padding: 60px 0; color: ${COLORS.text}; min-height: 100vh;">
    <!-- Main Card Container -->
    <div style="max-width: 640px; margin: 0 auto; background-color: ${COLORS.card}; box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-radius: 0;">
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
      from: 'Sade Chocolate <bilgi@sadechocolate.com>',
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

    <!-- Greeting & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 20px 0; color: ${COLORS.text}; font-style: italic;">
        Hoş Geldin, ${firstName}
      </h2>
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 40px 0; font-weight: 300;">
        Sade Chocolate ailesine katıldığın için çok mutluyuz. Artık el yapımı artisan çikolata dünyasının kapıları sana açık.
      </p>
    </div>

    <!-- Features Section -->
    <div style="padding: 50px; background: ${COLORS.bg};">
      <table style="width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 15px; text-align: center; width: 33%;">
            <div style="font-size: 28px; margin-bottom: 12px;">🌱</div>
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; color: ${COLORS.text}; font-weight: 600;">Tek Menşei</div>
            <div style="font-size: 11px; color: ${COLORS.gray}; margin-top: 4px;">Özenle seçilmiş kakao</div>
          </td>
          <td style="padding: 15px; text-align: center; width: 33%;">
            <div style="font-size: 28px; margin-bottom: 12px;">🍫</div>
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; color: ${COLORS.text}; font-weight: 600;">El Yapımı</div>
            <div style="font-size: 11px; color: ${COLORS.gray}; margin-top: 4px;">Geleneksel yöntemler</div>
          </td>
          <td style="padding: 15px; text-align: center; width: 33%;">
            <div style="font-size: 28px; margin-bottom: 12px;">✨</div>
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; color: ${COLORS.text}; font-weight: 600;">%100 Doğal</div>
            <div style="font-size: 11px; color: ${COLORS.gray}; margin-top: 4px;">Katkısız lezzet</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Section -->
    <div style="padding: 50px; text-align: center;">
      <a href="https://sadechocolate.com/#/catalog" style="display: inline-block; border: 1px solid ${COLORS.gold}; color: ${COLORS.text}; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
        Koleksiyonu Keşfet
      </a>
    </div>

    ${getEmailFooter()}
  `;

  return sendEmail({
    to: email,
    subject: `Hoş Geldin, ${firstName}!`,
    html: wrapEmail(content),
    text: `Hoş Geldin ${firstName}! Sade Chocolate ailesine katıldığın için çok mutluyuz. Koleksiyonumuzu keşfet: https://sadechocolate.com/#/catalog`
  });
};

/**
 * Sipariş Onay Emaili - Premium Template (Yeni Tasarım)
 */
export const sendOrderConfirmationEmail = async (
  email: string,
  orderData: {
    orderId: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number; image?: string; category?: string }>;
    subtotal: number;
    shipping: number;
    total: number;
    address: string;
  }
) => {
  // Ürün listesi HTML - görsel dahil
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 15px 0; width: 80px; vertical-align: top;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid ${COLORS.divider};" />` : ''}
      </td>
      <td style="padding: 15px 20px; vertical-align: middle;">
        <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 600; color: ${COLORS.text}; font-family: 'Playfair Display', Georgia, serif;">${item.name}</p>
        <p style="margin: 0; font-size: 12px; color: ${COLORS.gray}; letter-spacing: 0.5px;">${item.quantity} ADET${item.category ? ' / ' + item.category : ''}</p>
      </td>
      <td style="padding: 15px 0; text-align: right; vertical-align: middle;">
        <p style="margin: 0; font-size: 15px; font-weight: 500; color: ${COLORS.text};">₺${(item.price * item.quantity).toFixed(2)}</p>
      </td>
    </tr>
  `).join('');

  const content = `
    ${getEmailHeader()}

    <!-- Greeting & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 20px 0; color: ${COLORS.text}; font-style: italic;">
        Teşekkürler, ${orderData.customerName}
      </h2>
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 40px 0; font-weight: 300;">
        Siparişiniz atölyemize ulaştı. Usta şeflerimiz, seçiminizi en taze malzemelerle hazırlamak için işe koyuldu. Bu lezzet yolculuğunda bizi tercih ettiğiniz için onur duyuyoruz.
      </p>

      <!-- Order Number Badge -->
      <div style="border: 1px solid ${COLORS.gold}; display: inline-block; padding: 12px 30px; border-radius: 50px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${COLORS.gold}; display: block; margin-bottom: 2px;">Sipariş Referansı</span>
        <span style="font-size: 16px; font-weight: bold; color: ${COLORS.text}; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 1px;">#${orderData.orderId}</span>
      </div>
    </div>

    <!-- Product List Section -->
    <div style="padding: 50px;">
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: ${COLORS.gray}; border-bottom: 1px solid ${COLORS.divider}; padding-bottom: 15px; margin-bottom: 25px; text-align: left;">
        Sipariş Özeti
      </h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Financials -->
      <div style="margin-top: 30px; border-top: 1px solid ${COLORS.divider}; padding-top: 25px;">
        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size: 13px; color: ${COLORS.gray}; padding: 6px 0;">Ara Toplam</td>
            <td style="font-size: 14px; font-weight: 500; color: ${COLORS.text}; text-align: right; padding: 6px 0;">₺${orderData.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: ${COLORS.gray}; padding: 6px 0;">Kargo & Paketleme</td>
            <td style="font-size: 14px; font-weight: 500; color: ${COLORS.text}; text-align: right; padding: 6px 0;">${orderData.shipping === 0 ? 'Ücretsiz' : '₺' + orderData.shipping.toFixed(2)}</td>
          </tr>
        </table>

        <div style="width: 100%; height: 1px; background-color: ${COLORS.divider}; margin: 15px 0;"></div>

        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size: 18px; font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: ${COLORS.text};">Toplam Tutar</td>
            <td style="font-size: 24px; font-weight: bold; color: ${COLORS.gold}; font-family: 'Playfair Display', Georgia, serif; text-align: right;">₺${orderData.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>

    ${getEmailFooter()}
  `;

  return sendEmail({
    to: email,
    subject: `Siparişiniz Onaylandı! #${orderData.orderId}`,
    html: wrapEmail(content),
    text: `Siparişiniz onaylandı! Sipariş No: #${orderData.orderId}. Toplam: ₺${orderData.total.toFixed(2)}`
  });
};

/**
 * Kargo Bildirim Emaili - Premium Template (Yeni Tasarım)
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
    ${getEmailHeader()}

    <!-- Greeting & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 20px 0; color: ${COLORS.text}; font-style: italic;">
        Kargonuz Teslim Edildi!
      </h2>
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 40px 0; font-weight: 300;">
        Merhaba ${data.customerName}, <strong style="color: ${COLORS.gold};">#${data.orderId}</strong> numaralı siparişiniz özenle paketlendi ve kargo firmasına teslim edildi.
      </p>

      <!-- Tracking Number Badge -->
      <div style="border: 1px solid ${COLORS.gold}; display: inline-block; padding: 20px 40px; border-radius: 8px; margin-bottom: 40px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${COLORS.gold}; display: block; margin-bottom: 8px;">Takip Numarası</span>
        <span style="font-size: 22px; font-weight: bold; color: ${COLORS.text}; font-family: 'Courier New', monospace; letter-spacing: 3px;">${data.trackingNumber}</span>
        <span style="font-size: 12px; color: ${COLORS.gray}; display: block; margin-top: 8px;">${data.carrierName}</span>
      </div>
    </div>

    <!-- Track Button Section -->
    <div style="padding: 0 50px 50px; text-align: center;">
      ${data.trackingUrl ? `
      <a href="${data.trackingUrl}" style="display: inline-block; background: ${COLORS.text}; color: white; padding: 16px 48px; text-decoration: none; border-radius: 50px; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
        Kargoyu Takip Et
      </a>
      ` : ''}

      <!-- Delivery Info -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid ${COLORS.divider};">
        <p style="font-size: 14px; color: ${COLORS.gray}; margin: 0;">
          Tahmini teslimat süresi: <strong style="color: ${COLORS.text};">1-3 iş günü</strong>
        </p>
      </div>
    </div>

    ${getEmailFooter()}
  `;

  return sendEmail({
    to: email,
    subject: `Kargonuz Teslim Edildi - #${data.orderId}`,
    html: wrapEmail(content),
    text: `Kargonuz kargo firmasına teslim edildi! Takip No: ${data.trackingNumber} (${data.carrierName})`
  });
};

/**
 * Newsletter Abonelik Hoş Geldin Emaili - Minimalist Luxury Template
 * Template içeriği Firestore'dan çekilir (email_templates/newsletter_welcome)
 */
export const sendNewsletterWelcomeEmail = async (email: string) => {
  // Firestore'dan template ayarlarını çek
  let t = {
    // Logo Customization - Yan yana: Sade (Bold) + Chocolate (Regular)
    logoImageUrl: 'https://sadechocolate.com/kakaologo.png',
    logoShowImage: true,
    logoImageSize: 60,
    logoColor: '#C5A059',
    logoSadeText: 'Sade',
    logoChocolateText: 'Chocolate',
    logoSadeFont: "'Santana', Georgia, serif",
    logoChocolateFont: "'Santana', Georgia, serif",
    logoSadeSize: 28,
    logoChocolateSize: 28,
    logoLayout: 'horizontal', // 'horizontal' = yan yana, 'vertical' = altlı üstlü

    // Content
    headerBadge: '✦ Hoş Geldin ✦',
    mainTitle: 'Artisan Çikolata\nDünyasına Adım Attın',
    welcomeText: 'Bundan sonra yeni koleksiyonlar, özel teklifler ve artisan çikolata dünyasından hikayeler seninle.',
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
    },
    typography: {
      headingFont: 'Georgia, serif',
      bodyFont: 'Arial, sans-serif',
      headingSize: 32,
      bodySize: 15,
      lineHeight: 1.8
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
  const ty = t.typography || {
    headingFont: 'Georgia, serif',
    bodyFont: 'Arial, sans-serif',
    headingSize: 32,
    bodySize: 15,
    lineHeight: 1.8
  };
  const mainTitleHTML = t.mainTitle.replace(/\n/g, '<br>');

  // Logo değerleri
  const logoShowImage = t.logoShowImage !== false;
  const logoImageUrl = t.logoImageUrl || 'https://sadechocolate.com/kakaologo.png';
  const logoImageSize = t.logoImageSize || 60;
  const logoColor = t.logoColor || '#C5A059';
  const logoSadeText = t.logoSadeText || 'SADE';
  const logoChocolateText = t.logoChocolateText || 'Chocolate';
  const logoSadeFont = t.logoSadeFont || "'Santana', Georgia, serif";
  const logoChocolateFont = t.logoChocolateFont || "'Santana', Georgia, serif";
  const logoSadeSize = t.logoSadeSize || 28;
  const logoChocolateSize = t.logoChocolateSize || 11;

  // İndirim bölümü HTML'i
  const discountSectionHTML = t.discountEnabled ? `
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${c.headerBg}; margin-bottom: 48px;">
                    <tr>
                      <td style="padding: 40px 32px; text-align: center;">
                        <p style="margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 3px; color: ${c.accent}; text-transform: uppercase;">
                          ${t.discountLabel}
                        </p>
                        <p style="margin: 0 0 4px; font-family: ${ty.headingFont}; font-size: 64px; font-weight: normal; color: ${c.bodyBg}; line-height: 1;">
                          %${t.discountPercent}
                        </p>
                        <p style="margin: 0 0 24px; font-family: ${ty.headingFont}; font-size: 16px; font-style: italic; color: ${c.accent};">
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
    <body style="margin: 0; padding: 0; background-color: ${c.outerBg}; font-family: ${ty.bodyFont};">

      <!-- Outer Container -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${c.outerBg}; padding: 40px 20px;">
        <tr>
          <td align="center">

            <!-- Email Container with Shadow Effect -->
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${c.bodyBg}; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header Band -->
              <tr>
                <td style="background-color: ${c.headerBg}; padding: 40px 48px; text-align: center;">
                  <!-- Logo - Santana fontu ile görsel -->
                  <img src="https://sadechocolate.com/images/email-logo-dark.png" alt="Sade Chocolate" width="280" height="50" style="display: block; margin: 0 auto; max-width: 100%; height: auto;" />
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
                  <h2 style="text-align: center; margin: 0 0 32px; font-family: ${ty.headingFont}; font-size: ${ty.headingSize}px; font-weight: normal; font-style: italic; color: ${c.textPrimary}; line-height: 1.3;">
                    ${mainTitleHTML}
                  </h2>

                  <!-- Divider -->
                  <div style="width: 60px; height: 1px; background-color: ${c.accent}; margin: 0 auto 32px;"></div>

                  <!-- Welcome Text -->
                  <p style="text-align: center; margin: 0 0 48px; font-family: ${ty.bodyFont}; font-size: ${ty.bodySize}px; line-height: ${ty.lineHeight}; color: ${c.textSecondary};">
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
                        <p style="margin: 0; font-family: ${ty.bodyFont}; font-size: 13px; line-height: 1.6; color: ${c.textSecondary};">
                          ${t.benefit1Text}
                        </p>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" valign="top" style="padding-left: 16px;">
                        <p style="margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 9px; letter-spacing: 2px; color: ${c.accent}; text-transform: uppercase;">
                          ${t.benefit2Title}
                        </p>
                        <p style="margin: 0; font-family: ${ty.bodyFont}; font-size: 13px; line-height: 1.6; color: ${c.textSecondary};">
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
                  <p style="margin: 0 0 16px; font-family: ${ty.headingFont}; font-size: 14px; color: ${c.textPrimary};">
                    Sade Chocolate
                  </p>
                  <p style="margin: 0 0 8px; font-family: ${ty.bodyFont}; font-size: 11px; color: #999999; line-height: 1.6;">
                    Yeşilbahçe Mah. Çınarlı Cd. 47/A<br>
                    Muratpaşa, Antalya 07160
                  </p>
                  <p style="margin: 16px 0 0; font-family: ${ty.bodyFont}; font-size: 10px; color: #BBBBBB;">
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

/**
 * Kampanya Kodu Emaili - Özel Kampanya Duyurusu
 */
export const sendCampaignCodeEmail = async (
  email: string,
  firstName: string,
  campaignCode: string,
  bonusPoints: number,
  description: string,
  validUntil: string
) => {
  const expiryDate = new Date(validUntil).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const content = `
    ${getEmailHeader('ÖZE L KAMPANYA')}

    <!-- Campaign Hero -->
    <div style="background: linear-gradient(135deg, #FFF5E6 0%, ${COLORS.cream} 100%); padding: 40px 20px; text-align: center; position: relative;">
      <div style="font-size: 64px; margin-bottom: 16px;">🎁</div>
      <h1 style="font-family: Georgia, serif; font-size: 28px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
        Sizin İçin Özel!
      </h1>
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; margin: 0;">
        ${description}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 48px 40px;">
      <!-- Greeting -->
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 24px;">
        Merhaba ${firstName},
      </p>

      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 24px;">
        Sizin için özel bir kampanya kodu hazırladık! İlk siparişinizde kullanabileceğiniz bu kod ile <strong style="color: ${COLORS.gold};">${bonusPoints} bonus puan</strong> kazanma fırsatını yakalayın.
      </p>

      <!-- Campaign Code Box -->
      <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, #5D4740 100%); border-radius: 20px; padding: 32px; margin: 32px 0; text-align: center; box-shadow: 0 8px 30px rgba(75,56,50,0.2);">
        <p style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.gold}; margin: 0 0 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">
          Kampanya Kodunuz
        </p>
        <div style="background: white; border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 300px;">
          <code style="font-family: 'Courier New', monospace; font-size: 28px; color: ${COLORS.primary}; font-weight: bold; letter-spacing: 3px; display: block;">
            ${campaignCode}
          </code>
        </div>
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.cream}; margin: 16px 0 0; opacity: 0.9;">
          🎉 <strong style="color: ${COLORS.gold};">${bonusPoints} Puan</strong> kazanın!
        </p>
      </div>

      <!-- How to Use -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin: 32px 0;">
        <h3 style="font-family: Arial, sans-serif; font-size: 14px; color: ${COLORS.primary}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
          ✨ Nasıl Kullanılır?
        </h3>
        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0;">
              <table>
                <tr>
                  <td style="padding-right: 12px; vertical-align: top;">
                    <div style="width: 24px; height: 24px; background: ${COLORS.gold}; border-radius: 50%; color: white; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">1</div>
                  </td>
                  <td>
                    <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; margin: 0; line-height: 1.6;">
                      Kayıt sayfamıza gidin ve hesabınızı oluşturun
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <table>
                <tr>
                  <td style="padding-right: 12px; vertical-align: top;">
                    <div style="width: 24px; height: 24px; background: ${COLORS.gold}; border-radius: 50%; color: white; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">2</div>
                  </td>
                  <td>
                    <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; margin: 0; line-height: 1.6;">
                      "Referans Kodu" alanına <strong style="color: ${COLORS.primary};">${campaignCode}</strong> kodunu girin
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <table>
                <tr>
                  <td style="padding-right: 12px; vertical-align: top;">
                    <div style="width: 24px; height: 24px; background: ${COLORS.gold}; border-radius: 50%; color: white; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">3</div>
                  </td>
                  <td>
                    <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; margin: 0; line-height: 1.6;">
                      İlk siparişinizi tamamlayın ve bonusunuzu kazanın!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Urgency -->
      <div style="border-left: 4px solid ${COLORS.gold}; background: #FFF9F0; padding: 16px 20px; margin: 32px 0; border-radius: 8px;">
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; margin: 0; line-height: 1.6;">
          ⏰ <strong>Son kullanma tarihi:</strong> ${expiryDate}<br>
          Bu özel fırsatı kaçırmayın!
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="https://sadechocolate.com/#/register?ref=${campaignCode}" style="display: inline-block; background: ${COLORS.primary}; color: white; padding: 18px 48px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(75,56,50,0.3);">
          Hemen Kayıt Ol
        </a>
      </div>

      <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.lightText}; text-align: center; margin: 24px 0 0; line-height: 1.6;">
        Sorularınız mı var? Müşteri hizmetlerimiz size yardımcı olmaktan mutluluk duyar.
      </p>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `🎁 Sizin İçin Özel: ${bonusPoints} Puan Kazan!`,
    html: wrapEmail(content),
    text: `Merhaba ${firstName}! Sizin için özel kampanya kodu: ${campaignCode}. İlk siparişinizde ${bonusPoints} bonus puan kazanın! Son kullanma: ${expiryDate}. Kayıt ol: https://sadechocolate.com/#/register?ref=${campaignCode}`
  });
};

/**
 * Kampanya Hatırlatma Emaili - Süresi Dolmak Üzere
 */
export const sendCampaignReminderEmail = async (
  email: string,
  firstName: string,
  campaignCode: string,
  bonusPoints: number,
  validUntil: string,
  daysLeft: number
) => {
  const expiryDate = new Date(validUntil).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const content = `
    ${getEmailHeader('SON FIRSAT')}

    <!-- Urgency Hero -->
    <div style="background: linear-gradient(135deg, #FFE6E6 0%, #FFF0E6 100%); padding: 40px 20px; text-align: center;">
      <div style="font-size: 64px; margin-bottom: 16px;">⏰</div>
      <h1 style="font-family: Georgia, serif; font-size: 32px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
        Son ${daysLeft} Gün!
      </h1>
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; margin: 0;">
        Özel kampanyanızı kullanmayı unutmayın
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 48px 40px;">
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 24px;">
        Merhaba ${firstName},
      </p>

      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 24px;">
        Size özel hazırladığımız <strong style="color: ${COLORS.gold};">${bonusPoints} puan</strong> kazandıran kampanya kodunuz <strong>${expiryDate}</strong> tarihinde sona eriyor. Bu fırsatı kaçırmayın!
      </p>

      <!-- Campaign Code Box -->
      <div style="background: linear-gradient(135deg, #DC143C 0%, #B22222 100%); border-radius: 20px; padding: 32px; margin: 32px 0; text-align: center; box-shadow: 0 8px 30px rgba(220,20,60,0.2);">
        <p style="font-family: Arial, sans-serif; font-size: 11px; color: white; margin: 0 0 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">
          Kampanya Kodunuz
        </p>
        <div style="background: white; border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 300px;">
          <code style="font-family: 'Courier New', monospace; font-size: 28px; color: #DC143C; font-weight: bold; letter-spacing: 3px; display: block;">
            ${campaignCode}
          </code>
        </div>
        <p style="font-family: Georgia, serif; font-size: 20px; color: white; margin: 20px 0 0; font-weight: bold;">
          Son ${daysLeft} Gün!
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="https://sadechocolate.com/#/register?ref=${campaignCode}" style="display: inline-block; background: #DC143C; color: white; padding: 18px 48px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(220,20,60,0.3);">
          Hemen Kullan
        </a>
      </div>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `⏰ Son ${daysLeft} Gün: ${bonusPoints} Puan Fırsatı!`,
    html: wrapEmail(content),
    text: `Merhaba ${firstName}! Kampanya kodunuz ${expiryDate} tarihinde sona eriyor. Son ${daysLeft} gün! Kod: ${campaignCode}. Kayıt ol: https://sadechocolate.com/#/register?ref=${campaignCode}`
  });
};

/**
 * Ödeme Başarılı Emaili - Kredi Kartı ile Ödeme
 */
export const sendPaymentSuccessEmail = async (
  email: string,
  data: {
    customerName: string;
    orderId: string;
    cardInfo?: string;           // **** 1234 (son 4 hane)
    cardAssociation?: string;    // VISA, MASTER_CARD
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    shipping: number;
    total: number;
    loyaltyPointsEarned?: number;
  }
) => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text};">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.lightText};">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; font-weight: bold;">
        ₺${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const cardDisplayText = data.cardAssociation && data.cardInfo
    ? `${data.cardAssociation} **** ${data.cardInfo}`
    : 'Kredi Kartı';

  const content = `
    ${getEmailHeader('Ödeme Onaylandı')}

    <!-- Success Hero -->
    <div style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); padding: 48px 20px; text-align: center;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(76,175,80,0.3);">
        <span style="font-size: 40px; color: white;">✓</span>
      </div>
      <h1 style="font-family: Georgia, serif; font-size: 28px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
        Ödemeniz Başarılı!
      </h1>
      <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; margin: 0;">
        ${cardDisplayText} ile ödeme tamamlandı
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 48px 40px;">
      <!-- Greeting -->
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 16px;">
        Merhaba ${data.customerName},
      </p>
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 24px;">
        <strong style="color: ${COLORS.gold};">#${data.orderId}</strong> numaralı siparişinizin ödemesi başarıyla tamamlandı. Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir.
      </p>

      <!-- Payment Info -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <p style="font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.lightText}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">
              Ödeme Yöntemi
            </p>
            <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.primary}; margin: 0; font-weight: bold;">
              💳 ${cardDisplayText}
            </p>
          </div>
          <div style="text-align: right;">
            <p style="font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.lightText}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">
              İşlem Durumu
            </p>
            <p style="font-family: Arial, sans-serif; font-size: 12px; color: #4CAF50; margin: 0; font-weight: bold; background: #E8F5E9; padding: 4px 12px; border-radius: 20px;">
              ✓ ONAYLANDI
            </p>
          </div>
        </div>
      </div>

      <!-- Order Items -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.primary}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
          Sipariş Detayı
        </h3>
        <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase; letter-spacing: 1px;">Ürün</th>
              <th style="text-align: center; padding: 10px 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase; letter-spacing: 1px;">Adet</th>
              <th style="text-align: right; padding: 10px 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase; letter-spacing: 1px;">Fiyat</th>
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
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0;">Ara Toplam</td>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0; text-align: right;">₺${data.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0;">Kargo</td>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0; text-align: right;">${data.shipping === 0 ? 'Ücretsiz' : '₺' + data.shipping.toFixed(2)}</td>
          </tr>
          ${data.loyaltyPointsEarned ? `
          <tr>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0; color: ${COLORS.gold};">🎁 Kazanılan Puan</td>
            <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0; text-align: right; color: ${COLORS.gold};">+${data.loyaltyPointsEarned}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="2" style="padding: 12px 0 6px;"><div style="border-top: 1px solid rgba(255,255,255,0.2);"></div></td>
          </tr>
          <tr>
            <td style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: ${COLORS.gold};">Ödenen Tutar</td>
            <td style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; text-align: right; color: ${COLORS.gold};">₺${data.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Next Steps -->
      <div style="margin-top: 32px; padding: 24px; border: 1px solid #E8F5E9; border-radius: 16px; background: #F8FFF8;">
        <h3 style="font-family: Arial, sans-serif; font-size: 12px; color: #4CAF50; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">
          Sonraki Adımlar
        </h3>
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; margin: 0; line-height: 1.8;">
          📦 Siparişiniz özenle hazırlanacak<br>
          🚚 Kargoya verildiğinde takip numarası ile bilgilendirileceksiniz<br>
          🍫 Tahmini teslimat: 1-3 iş günü
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="https://sadechocolate.com/#/account?view=orders" style="display: inline-block; background: ${COLORS.primary}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(75,56,50,0.3);">
          Siparişi Takip Et
        </a>
      </div>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `Ödeme Onaylandı - Sipariş #${data.orderId}`,
    html: wrapEmail(content),
    text: `Ödemeniz başarıyla tamamlandı! Sipariş No: #${data.orderId}. Ödenen Tutar: ₺${data.total.toFixed(2)}. ${cardDisplayText} ile ödeme yapıldı.`
  });
};

/**
 * Ödeme Başarısız Emaili - Retry Link ile
 */
export const sendPaymentFailedEmail = async (
  email: string,
  data: {
    customerName: string;
    orderId: string;
    total: number;
    failureReason?: string;
    retryUrl: string;
  }
) => {
  const errorMessage = data.failureReason || 'Kart bilgilerinizi kontrol ediniz veya farklı bir kart deneyiniz.';

  const content = `
    ${getEmailHeader('Ödeme Başarısız')}

    <!-- Error Hero -->
    <div style="background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); padding: 48px 20px; text-align: center;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF5350 0%, #E53935 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(239,83,80,0.3);">
        <span style="font-size: 40px; color: white;">!</span>
      </div>
      <h1 style="font-family: Georgia, serif; font-size: 28px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
        Ödeme Tamamlanamadı
      </h1>
      <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; margin: 0;">
        Sipariş #${data.orderId}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 48px 40px;">
      <!-- Greeting -->
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 16px;">
        Merhaba ${data.customerName},
      </p>
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 24px;">
        <strong style="color: ${COLORS.gold};">₺${data.total.toFixed(2)}</strong> tutarındaki ödemeniz tamamlanamadı. Siparişiniz beklemede olup, ödemeyi tekrar deneyebilirsiniz.
      </p>

      <!-- Error Box -->
      <div style="background: #FFEBEE; border-left: 4px solid #EF5350; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <h4 style="font-family: Arial, sans-serif; font-size: 12px; color: #C62828; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">
          Hata Detayı
        </h4>
        <p style="font-family: Georgia, serif; font-size: 14px; color: #B71C1C; margin: 0; line-height: 1.6;">
          ${errorMessage}
        </p>
      </div>

      <!-- Suggestions -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
        <h3 style="font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.primary}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">
          💡 Öneriler
        </h3>
        <ul style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; margin: 0; padding-left: 20px; line-height: 2;">
          <li>Kart bilgilerinizi kontrol edin (kart numarası, son kullanma tarihi, CVV)</li>
          <li>Kartınızda yeterli bakiye olduğundan emin olun</li>
          <li>3D Secure doğrulamasını başarıyla tamamladığınızdan emin olun</li>
          <li>Farklı bir kredi/banka kartı ile deneyebilirsiniz</li>
          <li>Sorun devam ederse bankanızla iletişime geçin</li>
        </ul>
      </div>

      <!-- Order Summary -->
      <div style="background: #FFF9F0; border: 1px solid ${COLORS.gold}; border-radius: 16px; padding: 20px; margin-bottom: 32px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <p style="font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.lightText}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">
              Bekleyen Sipariş
            </p>
            <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.primary}; margin: 0; font-weight: bold;">
              #${data.orderId}
            </p>
          </div>
          <div style="text-align: right;">
            <p style="font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.lightText}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">
              Toplam Tutar
            </p>
            <p style="font-family: Georgia, serif; font-size: 20px; color: ${COLORS.gold}; margin: 0; font-weight: bold;">
              ₺${data.total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <!-- Retry CTA -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="${data.retryUrl}" style="display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(76,175,80,0.3);">
          Ödemeyi Tekrar Dene
        </a>
      </div>

      <p style="font-family: Georgia, serif; font-size: 13px; color: ${COLORS.lightText}; text-align: center; margin: 24px 0 0; line-height: 1.6;">
        Yardıma mı ihtiyacınız var? <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.gold}; text-decoration: none;">bilgi@sadechocolate.com</a> adresinden bize ulaşabilirsiniz.
      </p>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `Ödeme Tamamlanamadı - Sipariş #${data.orderId}`,
    html: wrapEmail(content),
    text: `Ödemeniz tamamlanamadı. Sipariş No: #${data.orderId}. Tutar: ₺${data.total.toFixed(2)}. Tekrar denemek için: ${data.retryUrl}`
  });
};

/**
 * Toplu Kampanya Emaili - Newsletter abonelerine
 */
export const sendBulkCampaignEmail = async (
  emails: string[],
  campaignCode: string,
  bonusPoints: number,
  description: string,
  validUntil: string
) => {
  const promises = emails.map(email =>
    sendCampaignCodeEmail(email, 'Değerli Müşterimiz', campaignCode, bonusPoints, description, validUntil)
  );

  try {
    await Promise.allSettled(promises);
    console.log(`📧 ${emails.length} adet kampanya emaili kuyruğa eklendi`);
    return true;
  } catch (error) {
    console.error('❌ Toplu email gönderimi hatası:', error);
    return false;
  }
};

/**
 * Teslimat Onay Emaili - Sipariş teslim edildiğinde
 */
export const sendDeliveryConfirmationEmail = async (
  email: string,
  data: {
    customerName: string;
    orderId: string;
    deliveryDate: string;
    items: Array<{ name: string; quantity: number }>;
    reviewUrl?: string;
  }
) => {
  const deliveryDateFormatted = new Date(data.deliveryDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsList = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text};">
        🍫 ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.lightText};">
        x${item.quantity}
      </td>
    </tr>
  `).join('');

  const content = `
    ${getEmailHeader('Teslim Edildi')}

    <!-- Success Hero -->
    <div style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); padding: 48px 20px; text-align: center;">
      <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 30px rgba(76,175,80,0.3);">
        <span style="font-size: 48px;">📦</span>
      </div>
      <h1 style="font-family: Georgia, serif; font-size: 32px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
        Siparişin Teslim Edildi!
      </h1>
      <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; margin: 0;">
        ${deliveryDateFormatted}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 48px 40px;">
      <!-- Greeting -->
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 16px;">
        Merhaba ${data.customerName},
      </p>
      <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 32px;">
        <strong style="color: ${COLORS.gold};">#${data.orderId}</strong> numaralı siparişin başarıyla teslim edildi. Umarız çikolatalarımız damak zevkine hitap eder!
      </p>

      <!-- Order Items -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
        <h3 style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.primary}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
          Teslim Edilen Ürünler
        </h3>
        <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
          <tbody>
            ${itemsList}
          </tbody>
        </table>
      </div>

      <!-- Chocolate Tips -->
      <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFF5E6 100%); border-left: 4px solid ${COLORS.gold}; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <h4 style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.primary}; margin: 0 0 12px; font-style: italic;">
          ✨ Lezzet İpuçları
        </h4>
        <ul style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>Saklama:</strong> Çikolatalarınızı 16-18°C serin ve kuru ortamda saklayın</li>
          <li><strong>Tadım:</strong> Oda sıcaklığında (20-22°C) tüketin, aromaları daha iyi hissedeceksiniz</li>
          <li><strong>Eşleştirme:</strong> Bitter çikolatalar kahve ile, sütlü çikolatalar çay ile mükemmel uyum sağlar</li>
        </ul>
      </div>

      <!-- Feedback Request -->
      <div style="background: ${COLORS.primary}; border-radius: 20px; padding: 32px; text-align: center; color: white;">
        <h3 style="font-family: Georgia, serif; font-size: 22px; margin: 0 0 12px; font-weight: normal; font-style: italic;">
          Deneyimini Paylaş
        </h3>
        <p style="font-family: Georgia, serif; font-size: 14px; opacity: 0.9; margin: 0 0 24px; line-height: 1.6;">
          Geri bildirimin bizim için çok değerli. Çikolatalarımız hakkındaki düşüncelerini duymak isteriz!
        </p>
        ${data.reviewUrl ? `
        <a href="${data.reviewUrl}" style="display: inline-block; background: ${COLORS.gold}; color: ${COLORS.primary}; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          Yorum Yaz
        </a>
        ` : `
        <a href="https://sadechocolate.com/#/account?view=orders" style="display: inline-block; background: ${COLORS.gold}; color: ${COLORS.primary}; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          Siparişlerimi Gör
        </a>
        `}
      </div>

      <!-- Social Share -->
      <div style="margin-top: 32px; text-align: center;">
        <p style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.lightText}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px;">
          Bizi Sosyal Medyada Takip Et
        </p>
        <div>
          <a href="https://instagram.com/sadechocolate" style="display: inline-block; width: 44px; height: 44px; background: ${COLORS.cream}; border-radius: 50%; margin: 0 8px; text-decoration: none; line-height: 44px;">
            <span style="font-size: 20px;">📸</span>
          </a>
          <a href="https://facebook.com/sadechocolate" style="display: inline-block; width: 44px; height: 44px; background: ${COLORS.cream}; border-radius: 50%; margin: 0 8px; text-decoration: none; line-height: 44px;">
            <span style="font-size: 20px;">👍</span>
          </a>
        </div>
        <p style="font-family: Georgia, serif; font-size: 13px; color: ${COLORS.gold}; margin: 16px 0 0; font-style: italic;">
          #SadeChocolate ile fotoğraflarını paylaş!
        </p>
      </div>

      <!-- Thank You Note -->
      <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid ${COLORS.border}; text-align: center;">
        <p style="font-family: Georgia, serif; font-size: 18px; color: ${COLORS.primary}; margin: 0; font-style: italic;">
          Bizi tercih ettiğin için teşekkürler!
        </p>
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.lightText}; margin: 12px 0 0;">
          Bir sonraki siparişinde görüşmek üzere 🍫
        </p>
      </div>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `Siparişin Teslim Edildi! #${data.orderId}`,
    html: wrapEmail(content),
    text: `Merhaba ${data.customerName}! #${data.orderId} numaralı siparişin ${deliveryDateFormatted} tarihinde teslim edildi. Afiyet olsun!`
  });
};

/**
 * Sipariş İptal Emaili - Ödeme Alınamadı durumu için özel şablon
 */
export const sendOrderCancellationEmail = async (
  order: any,
  cancelReason: string
) => {
  const customerName = order.customer?.name?.split(' ')[0] || 'Değerli Müşterimiz';
  const email = order.customer?.email;
  const orderId = order.id?.substring(0, 8) || order.id;

  if (!email) {
    console.error('❌ Email adresi bulunamadı');
    return false;
  }

  // Ödeme alınamadı için özel mesaj
  const isPaymentNotReceived = cancelReason === 'Ödeme Alınamadı';

  const content = `
    ${getEmailHeader()}

    <!-- İptal Banner -->
    <div style="background: linear-gradient(135deg, #FEE2E2 0%, #FFF5F5 100%); padding: 40px 20px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
      <h1 style="font-family: Georgia, serif; font-size: 28px; color: #991B1B; margin: 0; font-weight: normal; font-style: italic;">
        Siparişiniz İptal Edildi
      </h1>
    </div>

    <!-- Content -->
    <div style="padding: 48px 40px;">
      <p style="font-family: Georgia, serif; font-size: 18px; color: ${COLORS.primary}; margin: 0 0 24px;">
        Merhaba ${customerName},
      </p>

      ${isPaymentNotReceived ? `
      <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 16px; padding: 20px; margin: 0 0 24px;">
        <p style="font-family: Georgia, serif; font-size: 15px; color: #92400E; margin: 0; line-height: 1.7;">
          <strong>⏰ Ödeme Süresi Doldu</strong><br>
          Havale/EFT ödemesi belirlenen süre içinde tarafımıza ulaşmadığından siparişiniz iptal edilmiştir.
        </p>
      </div>
      ` : `
      <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; margin: 0 0 24px; line-height: 1.7;">
        <strong>#${orderId}</strong> numaralı siparişiniz "${cancelReason}" nedeniyle iptal edilmiştir.
      </p>
      `}

      <!-- Sipariş Özeti -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin: 24px 0;">
        <p style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.gold}; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px;">
          İptal Edilen Sipariş
        </p>
        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.lightText}; padding: 8px 0;">Sipariş No</td>
            <td style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; padding: 8px 0; text-align: right; font-weight: bold;">#${orderId}</td>
          </tr>
          <tr>
            <td style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.lightText}; padding: 8px 0;">Toplam Tutar</td>
            <td style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; padding: 8px 0; text-align: right; font-weight: bold;">₺${(order.payment?.total || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.lightText}; padding: 8px 0;">İptal Nedeni</td>
            <td style="font-family: Georgia, serif; font-size: 14px; color: #DC2626; padding: 8px 0; text-align: right; font-weight: bold;">${cancelReason}</td>
          </tr>
        </table>
      </div>

      <!-- Yeniden Sipariş CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; margin: 0 0 20px;">
          ${isPaymentNotReceived ? 'Siparişinizi yeniden oluşturmak isterseniz:' : 'Size yardımcı olmak için buradayız:'}
        </p>
        <a href="https://sadechocolate.com/#/catalog" style="display: inline-block; background: ${COLORS.primary}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          ${isPaymentNotReceived ? 'Yeniden Sipariş Ver' : 'Mağazaya Git'}
        </a>
      </div>

      <!-- İletişim Bilgisi -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${COLORS.border}; text-align: center;">
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.lightText}; margin: 0; line-height: 1.7;">
          Sorularınız için bize ulaşabilirsiniz:<br>
          <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.gold}; text-decoration: none;">bilgi@sadechocolate.com</a> |
          <a href="tel:+902423211234" style="color: ${COLORS.gold}; text-decoration: none;">0242 321 12 34</a>
        </p>
      </div>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `Siparişiniz İptal Edildi - #${orderId}`,
    html: wrapEmail(content),
    text: `Merhaba ${customerName}! #${orderId} numaralı siparişiniz "${cancelReason}" nedeniyle iptal edilmiştir. Sorularınız için bilgi@sadechocolate.com adresine ulaşabilirsiniz.`
  });
};

/**
 * EFT/Havale Sipariş Onay Emaili
 * Banka bilgileri, tutar ve ödeme süresi içerir
 */
export const sendEftOrderPendingEmail = async (
  email: string,
  orderData: {
    orderId: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    shipping: number;
    discount?: number;
    total: number;
    address: string;
    paymentDeadline: string; // ISO date string
    bankAccounts: Array<{
      bankName: string;
      accountHolder: string;
      iban: string;
    }>;
  }
) => {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text};">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.lightText};">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; font-weight: bold;">
        ₺${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  // Ödeme son tarihi formatla
  const deadlineDate = new Date(orderData.paymentDeadline);
  const formattedDeadline = deadlineDate.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Kalan süreyi hesapla
  const hoursLeft = Math.max(0, Math.floor((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60)));

  // Banka hesapları HTML
  const bankAccountsHtml = orderData.bankAccounts.map((account, index) => `
    <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: ${index < orderData.bankAccounts.length - 1 ? '12px' : '0'}; border: 1px solid ${COLORS.border};">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 8px;">🏦</span>
        <span style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: ${COLORS.primary};">${account.bankName}</span>
      </div>
      <table style="width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.lightText}; padding: 4px 0; text-transform: uppercase; letter-spacing: 1px;">Hesap Sahibi</td>
          <td style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; padding: 4px 0; text-align: right; font-weight: bold;">${account.accountHolder}</td>
        </tr>
        <tr>
          <td style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.lightText}; padding: 4px 0; text-transform: uppercase; letter-spacing: 1px;">IBAN</td>
          <td style="font-family: 'Courier New', monospace; font-size: 13px; color: ${COLORS.primary}; padding: 4px 0; text-align: right; letter-spacing: 1px;">${account.iban}</td>
        </tr>
      </table>
    </div>
  `).join('');

  const content = `
    ${getEmailHeader('ÖDEME BEKLENİYOR')}

    <!-- Uyarı Banner -->
    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 24px 20px; text-align: center; border-bottom: 3px solid #F59E0B;">
      <div style="display: inline-flex; align-items: center; gap: 12px;">
        <span style="font-size: 28px;">⏰</span>
        <div style="text-align: left;">
          <p style="font-family: Arial, sans-serif; font-size: 12px; color: #92400E; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
            Ödeme Son Tarihi
          </p>
          <p style="font-family: Georgia, serif; font-size: 18px; color: #78350F; margin: 0; font-weight: bold;">
            ${formattedDeadline}
          </p>
        </div>
      </div>
      <p style="font-family: Georgia, serif; font-size: 13px; color: #92400E; margin: 12px 0 0;">
        ${hoursLeft > 0 ? `Kalan süre: <strong>${hoursLeft} saat</strong>` : 'Süre dolmak üzere!'}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px;">
      <!-- Greeting -->
      <h1 style="font-family: Georgia, serif; font-size: 26px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
        Siparişiniz Alındı, ${orderData.customerName}!
      </h1>
      <p style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.gold}; margin: 0 0 24px; letter-spacing: 1px;">
        Sipariş No: #${orderData.orderId}
      </p>

      <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; line-height: 1.7; margin: 0 0 32px;">
        Siparişiniz başarıyla oluşturuldu. Ödemenizi aşağıdaki banka hesaplarından birine <strong style="color: ${COLORS.primary};">belirtilen süre içinde</strong> yapmanız gerekmektedir. Ödeme onaylandıktan sonra siparişiniz hazırlanmaya başlayacaktır.
      </p>

      <!-- Ödenecek Tutar -->
      <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, #5D4740 100%); border-radius: 16px; padding: 28px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 20px rgba(75,56,50,0.2);">
        <p style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.gold}; margin: 0 0 8px; letter-spacing: 2px; text-transform: uppercase;">
          Ödenecek Tutar
        </p>
        <p style="font-family: Georgia, serif; font-size: 42px; color: white; margin: 0; font-weight: bold;">
          ₺${orderData.total.toFixed(2)}
        </p>
        ${orderData.discount ? `
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.gold}; margin: 8px 0 0;">
          (₺${orderData.discount.toFixed(2)} EFT indirimi uygulandı)
        </p>
        ` : ''}
      </div>

      <!-- Banka Hesapları -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.primary}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
          🏦 Banka Hesap Bilgileri
        </h3>
        ${bankAccountsHtml}
      </div>

      <!-- Önemli Notlar -->
      <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h4 style="font-family: Arial, sans-serif; font-size: 12px; color: #92400E; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
          ⚠️ Önemli Bilgiler
        </h4>
        <ul style="font-family: Georgia, serif; font-size: 14px; color: #78350F; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Açıklama kısmına mutlaka <strong>#${orderData.orderId}</strong> sipariş numaranızı yazın</li>
          <li>Ödeme ${formattedDeadline} tarihine kadar yapılmalıdır</li>
          <li>Süre içinde ödeme yapılmazsa sipariş otomatik iptal edilecektir</li>
          <li>Ödeme sonrası dekontunuzu <a href="mailto:bilgi@sadechocolate.com" style="color: #D97706; text-decoration: none; font-weight: bold;">bilgi@sadechocolate.com</a> adresine gönderebilirsiniz</li>
        </ul>
      </div>

      <!-- Sipariş Detayı -->
      <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.primary}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
          📦 Sipariş Detayı
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
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${COLORS.border};">
          <table style="width: 100%;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family: Georgia, serif; font-size: 13px; color: ${COLORS.lightText}; padding: 4px 0;">Ara Toplam</td>
              <td style="font-family: Georgia, serif; font-size: 13px; color: ${COLORS.text}; padding: 4px 0; text-align: right;">₺${orderData.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-family: Georgia, serif; font-size: 13px; color: ${COLORS.lightText}; padding: 4px 0;">Kargo</td>
              <td style="font-family: Georgia, serif; font-size: 13px; color: ${COLORS.text}; padding: 4px 0; text-align: right;">${orderData.shipping === 0 ? 'Ücretsiz' : '₺' + orderData.shipping.toFixed(2)}</td>
            </tr>
            ${orderData.discount ? `
            <tr>
              <td style="font-family: Georgia, serif; font-size: 13px; color: #16A34A; padding: 4px 0;">EFT İndirimi</td>
              <td style="font-family: Georgia, serif; font-size: 13px; color: #16A34A; padding: 4px 0; text-align: right;">-₺${orderData.discount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.primary}; padding: 12px 0 0; font-weight: bold;">Toplam</td>
              <td style="font-family: Georgia, serif; font-size: 18px; color: ${COLORS.primary}; padding: 12px 0 0; text-align: right; font-weight: bold;">₺${orderData.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Teslimat Adresi -->
      <div style="padding: 20px; border: 1px solid ${COLORS.border}; border-radius: 12px;">
        <h3 style="font-family: Arial, sans-serif; font-size: 11px; color: ${COLORS.lightText}; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">
          📍 Teslimat Adresi
        </h3>
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; margin: 0; line-height: 1.6;">
          ${orderData.address}
        </p>
      </div>

      <!-- Destek -->
      <div style="margin-top: 32px; text-align: center;">
        <p style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.lightText}; margin: 0; line-height: 1.7;">
          Sorularınız için: <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.gold}; text-decoration: none;">bilgi@sadechocolate.com</a>
        </p>
      </div>
    </div>

    ${getEmailFooter(email)}
  `;

  return sendEmail({
    to: email,
    subject: `Ödeme Bekleniyor - Sipariş #${orderData.orderId}`,
    html: wrapEmail(content),
    text: `Merhaba ${orderData.customerName}! #${orderData.orderId} numaralı siparişiniz alındı. Toplam ₺${orderData.total.toFixed(2)} tutarındaki ödemenizi ${formattedDeadline} tarihine kadar banka hesabımıza yapmanız gerekmektedir. Açıklama kısmına sipariş numaranızı yazmayı unutmayın.`
  });
};
