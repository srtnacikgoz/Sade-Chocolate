/**
 * Email Preview Service
 * Admin panelde email şablonlarını önizlemek için
 * emailService.ts ile aynı yapıyı kullanır
 *
 * ÖNEMLİ: Bu dosya emailService.ts ile SENKRON olmalıdır!
 * Her iki dosyada da aynı tasarım kullanılmalıdır.
 */

// Yeni Premium Marka Renkleri (emailService.ts ile AYNI olmalı)
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

// Ortak email footer - Minimal & Elegant
const getEmailFooter = () => `
  ${getAtmosphericFooter()}

  <div style="background-color: ${COLORS.bg}; padding: 30px; text-align: center;">
    <p style="font-size: 10px; color: #A09890; margin: 0 0 15px 0; letter-spacing: 1px; text-transform: uppercase;">
      Yeşilbahçe Mah. Çınarlı Cad. No:47, Antalya
    </p>
    <div style="font-size: 11px;">
      <a href="https://sadechocolate.com/account" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Hesabım</a>
      <a href="https://sadechocolate.com/catalog" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Koleksiyonlar</a>
      <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">İletişim</a>
    </div>
    <p style="font-size: 10px; color: #BDB6B0; margin-top: 20px;">© 2026 Sade Chocolate. All rights reserved.</p>
  </div>
`;

// Ortak email header - Minimal & Elegant
const getEmailHeader = (badge?: string) => `
  <!-- Top Border Accent -->
  <div style="height: 4px; background-color: ${COLORS.text}; width: 100%;"></div>

  <!-- Branding Header -->
  <div style="padding: 50px 0 30px; text-align: center;">
    <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 48px; color: ${COLORS.text}; margin: 0; font-style: italic; letter-spacing: -1px;">Sade</h1>
    <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 4px; color: ${COLORS.gold}; margin-top: 5px; font-weight: 600;">Artisan Chocolate</p>
  </div>

  <!-- Divider -->
  <div style="width: 40px; height: 1px; background-color: ${COLORS.gold}; margin: 0 auto 40px;"></div>

  ${badge ? `
  <!-- Badge -->
  <div style="text-align: center; margin: 0 0 30px 0;">
    <span style="display: inline-block; background: ${COLORS.text}; color: ${COLORS.card}; padding: 10px 24px; font-family: Arial, sans-serif; font-size: 10px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
      ${badge}
    </span>
  </div>
  ` : ''}
`;

// Email wrapper - Yeni Premium Stil
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

/**
 * Sipariş Onay Emaili Preview
 */
export const getOrderConfirmationPreview = () => {
  const itemsHtml = [
    { name: 'Ruby Tablet Çikolata', quantity: 1, price: 145 },
    { name: 'Dark %70 Kakao', quantity: 2, price: 190 },
  ].map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid ${COLORS.divider}; font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: ${COLORS.text};">
        ${item.name}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid ${COLORS.divider}; text-align: center; font-size: 13px; color: ${COLORS.gray};">
        ${item.quantity}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid ${COLORS.divider}; text-align: right; font-size: 15px; color: ${COLORS.text}; font-weight: bold;">
        ₺${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const content = `
    ${getEmailHeader('Sipariş Onaylandı')}

    <!-- Greeting -->
    <div style="padding: 0 50px; text-align: center;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 10px 0; color: ${COLORS.text}; font-style: italic;">
        Teşekkürler, Ayşe
      </h2>
      <p style="font-size: 12px; color: ${COLORS.gold}; margin: 0 0 30px; letter-spacing: 2px; text-transform: uppercase;">
        Sipariş No: #SADE-ABC123
      </p>
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 40px 0; font-weight: 300;">
        Siparişiniz başarıyla alındı. En kısa sürede özenle hazırlanıp kargoya verilecektir.
      </p>
    </div>

    <!-- Order Details -->
    <div style="background: ${COLORS.bg}; padding: 40px 50px; margin: 0 0 0 0;">
      <h3 style="font-size: 10px; color: ${COLORS.text}; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
        Sipariş Detayı
      </h3>
      <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="text-align: left; padding: 12px 0; border-bottom: 2px solid ${COLORS.text}; font-size: 10px; color: ${COLORS.text}; text-transform: uppercase; letter-spacing: 1px;">Ürün</th>
            <th style="text-align: center; padding: 12px 0; border-bottom: 2px solid ${COLORS.text}; font-size: 10px; color: ${COLORS.text}; text-transform: uppercase; letter-spacing: 1px;">Adet</th>
            <th style="text-align: right; padding: 12px 0; border-bottom: 2px solid ${COLORS.text}; font-size: 10px; color: ${COLORS.text}; text-transform: uppercase; letter-spacing: 1px;">Fiyat</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Total Section -->
    <div style="background: ${COLORS.footerBg}; padding: 30px 50px; color: white;">
      <table style="width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size: 14px; padding: 8px 0; color: ${COLORS.footerText};">Ara Toplam</td>
          <td style="font-size: 14px; padding: 8px 0; text-align: right; color: ${COLORS.footerText};">₺335.00</td>
        </tr>
        <tr>
          <td style="font-size: 14px; padding: 8px 0; color: ${COLORS.footerText};">Kargo</td>
          <td style="font-size: 14px; padding: 8px 0; text-align: right; color: ${COLORS.footerText};">₺75.00</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 16px 0 8px;"><div style="border-top: 1px solid rgba(255,255,255,0.2);"></div></td>
        </tr>
        <tr>
          <td style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: bold; color: ${COLORS.gold};">Toplam</td>
          <td style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: bold; text-align: right; color: ${COLORS.gold};">₺410.00</td>
        </tr>
      </table>
    </div>

    <!-- Delivery Address -->
    <div style="padding: 40px 50px;">
      <div style="border: 1px solid ${COLORS.divider}; padding: 25px;">
        <h3 style="font-size: 10px; color: ${COLORS.gray}; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px;">
          Teslimat Adresi
        </h3>
        <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: ${COLORS.text}; margin: 0; line-height: 1.6;">
          Yeşilbahçe Mah. Çınarlı Cd. 47/A<br>Muratpaşa, Antalya 07160
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="#" style="display: inline-block; background: ${COLORS.text}; color: ${COLORS.card}; padding: 16px 48px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          Siparişi Takip Et
        </a>
      </div>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Ödeme Başarılı Emaili Preview
 */
export const getPaymentSuccessPreview = () => {
  const content = `
    ${getEmailHeader('Ödeme Onaylandı')}

    <!-- Success Icon & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px; color: white;">✓</span>
      </div>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 10px 0; color: ${COLORS.text}; font-style: italic;">
        Ödemeniz Başarılı
      </h2>
      <p style="font-size: 14px; color: ${COLORS.gray}; margin: 0 0 40px;">
        VISA **** 1234 ile ödeme tamamlandı
      </p>
    </div>

    <!-- Order Info -->
    <div style="padding: 0 50px 40px;">
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 30px; font-weight: 300;">
        <strong style="color: ${COLORS.gold};">#SADE-ABC123</strong> numaralı siparişinizin ödemesi başarıyla tamamlandı.
      </p>

      <!-- Payment Info Box -->
      <div style="background: ${COLORS.bg}; padding: 25px; margin-bottom: 25px;">
        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 50%;">
              <p style="font-size: 10px; color: ${COLORS.gray}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Ödeme Yöntemi</p>
              <p style="font-size: 15px; color: ${COLORS.text}; margin: 0; font-weight: 600;">💳 VISA **** 1234</p>
            </td>
            <td style="text-align: right;">
              <p style="font-size: 10px; color: ${COLORS.gray}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">İşlem Durumu</p>
              <span style="display: inline-block; background: #E8F5E9; color: #4CAF50; padding: 6px 14px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">✓ ONAYLANDI</span>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Total Section -->
    <div style="background: ${COLORS.footerBg}; padding: 30px 50px; color: white;">
      <table style="width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size: 14px; padding: 6px 0; color: ${COLORS.footerText};">Ara Toplam</td>
          <td style="font-size: 14px; padding: 6px 0; text-align: right; color: ${COLORS.footerText};">₺335.00</td>
        </tr>
        <tr>
          <td style="font-size: 14px; padding: 6px 0; color: ${COLORS.footerText};">Kargo</td>
          <td style="font-size: 14px; padding: 6px 0; text-align: right; color: ${COLORS.footerText};">₺75.00</td>
        </tr>
        <tr>
          <td style="font-size: 14px; padding: 6px 0; color: ${COLORS.gold};">🎁 Kazanılan Puan</td>
          <td style="font-size: 14px; padding: 6px 0; text-align: right; color: ${COLORS.gold};">+41</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 12px 0 6px;"><div style="border-top: 1px solid rgba(255,255,255,0.2);"></div></td>
        </tr>
        <tr>
          <td style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: bold; color: ${COLORS.gold};">Ödenen Tutar</td>
          <td style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: bold; text-align: right; color: ${COLORS.gold};">₺410.00</td>
        </tr>
      </table>
    </div>

    <!-- Next Steps -->
    <div style="padding: 40px 50px;">
      <div style="border-left: 3px solid #4CAF50; background: #F8FFF8; padding: 20px 25px;">
        <h3 style="font-size: 11px; color: #4CAF50; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
          Sonraki Adımlar
        </h3>
        <p style="font-size: 14px; color: ${COLORS.text}; margin: 0; line-height: 1.9;">
          📦 Siparişiniz özenle hazırlanacak<br>
          🚚 Kargoya verildiğinde bilgilendirileceksiniz<br>
          🍫 Tahmini teslimat: 1-3 iş günü
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="#" style="display: inline-block; background: ${COLORS.text}; color: ${COLORS.card}; padding: 16px 48px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          Siparişi Takip Et
        </a>
      </div>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Ödeme Başarısız Emaili Preview
 */
export const getPaymentFailedPreview = () => {
  const content = `
    ${getEmailHeader('Ödeme Başarısız')}

    <!-- Error Icon & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #EF5350 0%, #E53935 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px; color: white;">!</span>
      </div>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 10px 0; color: ${COLORS.text}; font-style: italic;">
        Ödeme Tamamlanamadı
      </h2>
      <p style="font-size: 14px; color: ${COLORS.gray}; margin: 0 0 40px;">
        Sipariş #SADE-ABC123
      </p>
    </div>

    <!-- Message -->
    <div style="padding: 0 50px 40px;">
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 30px; font-weight: 300;">
        <strong style="color: ${COLORS.gold};">₺410.00</strong> tutarındaki ödemeniz tamamlanamadı. Siparişiniz beklemede olup, ödemeyi tekrar deneyebilirsiniz.
      </p>

      <!-- Error Box -->
      <div style="border-left: 3px solid #EF5350; background: #FFEBEE; padding: 20px 25px; margin-bottom: 30px;">
        <h4 style="font-size: 11px; color: #C62828; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
          Hata Detayı
        </h4>
        <p style="font-size: 14px; color: #B71C1C; margin: 0; line-height: 1.6;">
          Kart bilgilerinizi kontrol ediniz veya farklı bir kart deneyiniz.
        </p>
      </div>

      <!-- Suggestions -->
      <div style="background: ${COLORS.bg}; padding: 25px; margin-bottom: 30px;">
        <h3 style="font-size: 11px; color: ${COLORS.text}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
          💡 Öneriler
        </h3>
        <ul style="font-size: 14px; color: ${COLORS.text}; margin: 0; padding-left: 20px; line-height: 2;">
          <li>Kart bilgilerinizi kontrol edin</li>
          <li>Kartınızda yeterli bakiye olduğundan emin olun</li>
          <li>3D Secure doğrulamasını tamamlayın</li>
          <li>Farklı bir kart deneyebilirsiniz</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0 20px;">
        <a href="#" style="display: inline-block; background: #4CAF50; color: white; padding: 16px 48px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          Ödemeyi Tekrar Dene
        </a>
      </div>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Kargo Bildirim Emaili Preview
 */
export const getShippingNotificationPreview = () => {
  const content = `
    ${getEmailHeader('Kargoya Verildi')}

    <!-- Shipping Icon & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <div style="font-size: 48px; margin: 0 0 24px;">📦</div>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 15px 0; color: ${COLORS.text}; font-style: italic;">
        Siparişin Yola Çıktı!
      </h2>
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 40px; font-weight: 300;">
        <strong style="color: ${COLORS.gold};">#SADE-ABC123</strong> numaralı siparişin kargoya verildi.
      </p>
    </div>

    <!-- Tracking Number Box -->
    <div style="background: ${COLORS.bg}; padding: 40px 50px; text-align: center;">
      <p style="font-size: 10px; color: ${COLORS.gray}; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px;">
        Takip Numarası
      </p>
      <p style="font-family: 'Courier New', monospace; font-size: 26px; color: ${COLORS.text}; margin: 0 0 8px; font-weight: bold; letter-spacing: 3px;">
        MNG123456789
      </p>
      <p style="font-size: 13px; color: ${COLORS.gold}; margin: 0; font-weight: 600;">
        MNG Kargo
      </p>
    </div>

    <!-- CTA & Info -->
    <div style="padding: 40px 50px; text-align: center;">
      <a href="#" style="display: inline-block; background: ${COLORS.text}; color: ${COLORS.card}; padding: 16px 48px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
        Kargoyu Takip Et
      </a>

      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid ${COLORS.divider};">
        <p style="font-size: 14px; color: ${COLORS.gray}; margin: 0;">
          Tahmini teslimat: <strong style="color: ${COLORS.text};">1-3 iş günü</strong>
        </p>
      </div>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Teslimat Onay Emaili Preview
 */
export const getDeliveryConfirmationPreview = () => {
  const content = `
    ${getEmailHeader('Teslim Edildi')}

    <!-- Delivery Icon & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">✓</span>
      </div>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 10px 0; color: ${COLORS.text}; font-style: italic;">
        Siparişin Teslim Edildi!
      </h2>
      <p style="font-size: 14px; color: ${COLORS.gray}; margin: 0 0 40px;">
        15 Ocak 2026, 14:30
      </p>
    </div>

    <!-- Message -->
    <div style="padding: 0 50px 40px;">
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 30px; font-weight: 300;">
        <strong style="color: ${COLORS.gold};">#SADE-ABC123</strong> numaralı siparişin başarıyla teslim edildi. Umarız çikolatalarımız damak zevkine hitap eder!
      </p>

      <!-- Delivered Items -->
      <div style="background: ${COLORS.bg}; padding: 25px; margin-bottom: 30px;">
        <h3 style="font-size: 10px; color: ${COLORS.text}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
          Teslim Edilen Ürünler
        </h3>
        <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.divider}; font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: ${COLORS.text};">
              🍫 Ruby Tablet Çikolata
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.divider}; text-align: right; font-size: 13px; color: ${COLORS.gray};">
              x1
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.divider}; font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: ${COLORS.text};">
              🍫 Dark %70 Kakao
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.divider}; text-align: right; font-size: 13px; color: ${COLORS.gray};">
              x2
            </td>
          </tr>
        </table>
      </div>

      <!-- Flavor Tips -->
      <div style="border-left: 3px solid ${COLORS.gold}; background: #FFF9F0; padding: 20px 25px; margin-bottom: 30px;">
        <h4 style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: ${COLORS.text}; margin: 0 0 12px; font-style: italic;">
          ✨ Lezzet İpuçları
        </h4>
        <ul style="font-size: 14px; color: ${COLORS.text}; margin: 0; padding-left: 20px; line-height: 1.9;">
          <li><strong>Saklama:</strong> 16-18°C serin ve kuru ortamda</li>
          <li><strong>Tadım:</strong> Oda sıcaklığında tüketin</li>
          <li><strong>Eşleştirme:</strong> Bitter-kahve, sütlü-çay</li>
        </ul>
      </div>
    </div>

    <!-- Share Experience CTA -->
    <div style="background: ${COLORS.footerBg}; padding: 40px 50px; text-align: center; color: white;">
      <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; margin: 0 0 12px; font-weight: normal; font-style: italic; color: ${COLORS.gold};">
        Deneyimini Paylaş
      </h3>
      <p style="font-size: 14px; color: ${COLORS.footerText}; margin: 0 0 24px; line-height: 1.6;">
        Geri bildirimin bizim için çok değerli.
      </p>
      <a href="#" style="display: inline-block; background: ${COLORS.gold}; color: ${COLORS.footerBg}; padding: 14px 36px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
        Yorum Yaz
      </a>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Sipariş İptal Emaili Preview
 */
export const getOrderCancellationPreview = () => {
  const content = `
    ${getEmailHeader()}

    <!-- Cancel Icon & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <div style="font-size: 48px; margin: 0 0 20px;">😔</div>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 40px 0; color: #991B1B; font-style: italic;">
        Siparişiniz İptal Edildi
      </h2>
    </div>

    <!-- Content -->
    <div style="padding: 0 50px 40px;">
      <!-- Warning Box -->
      <div style="border-left: 3px solid #F59E0B; background: #FEF3C7; padding: 20px 25px; margin-bottom: 30px;">
        <p style="font-size: 14px; color: #92400E; margin: 0; line-height: 1.7;">
          <strong>⏰ Ödeme Süresi Doldu</strong><br>
          Havale/EFT ödemesi belirlenen süre içinde tarafımıza ulaşmadığından siparişiniz iptal edilmiştir.
        </p>
      </div>

      <!-- Cancelled Order Details -->
      <div style="background: ${COLORS.bg}; padding: 25px; margin-bottom: 30px;">
        <p style="font-size: 10px; color: ${COLORS.gold}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
          İptal Edilen Sipariş
        </p>
        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size: 14px; color: ${COLORS.gray}; padding: 8px 0;">Sipariş No</td>
            <td style="font-size: 14px; color: ${COLORS.text}; padding: 8px 0; text-align: right; font-weight: bold;">#SADE-ABC123</td>
          </tr>
          <tr>
            <td style="font-size: 14px; color: ${COLORS.gray}; padding: 8px 0;">Toplam Tutar</td>
            <td style="font-size: 14px; color: ${COLORS.text}; padding: 8px 0; text-align: right; font-weight: bold;">₺410.00</td>
          </tr>
          <tr>
            <td style="font-size: 14px; color: ${COLORS.gray}; padding: 8px 0;">İptal Nedeni</td>
            <td style="font-size: 14px; color: #DC2626; padding: 8px 0; text-align: right; font-weight: bold;">Ödeme Alınamadı</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0;">
        <p style="font-size: 15px; color: ${COLORS.gray}; margin: 0 0 20px;">
          Siparişinizi yeniden oluşturmak isterseniz:
        </p>
        <a href="#" style="display: inline-block; background: ${COLORS.text}; color: ${COLORS.card}; padding: 16px 48px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          Yeniden Sipariş Ver
        </a>
      </div>

      <!-- Contact Info -->
      <div style="padding-top: 30px; border-top: 1px solid ${COLORS.divider}; text-align: center;">
        <p style="font-size: 14px; color: ${COLORS.gray}; margin: 0; line-height: 1.7;">
          Sorularınız için:<br>
          <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.gold}; text-decoration: none;">bilgi@sadechocolate.com</a>
        </p>
      </div>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Hoş Geldin Emaili Preview
 */
export const getWelcomePreview = () => {
  const content = `
    ${getEmailHeader()}

    <!-- Greeting & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 20px 0; color: ${COLORS.text}; font-style: italic;">
        Hoş Geldin, Ayşe
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
            <div style="font-size: 11px; color: ${COLORS.gray}; margin-top: 4px;">Geleneksel üretim</div>
          </td>
          <td style="padding: 15px; text-align: center; width: 33%;">
            <div style="font-size: 28px; margin-bottom: 12px;">✨</div>
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; color: ${COLORS.text}; font-weight: 600;">%100 Doğal</div>
            <div style="font-size: 11px; color: ${COLORS.gray}; margin-top: 4px;">Katkısız lezzet</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding: 50px; text-align: center;">
      <a href="#" style="display: inline-block; background: ${COLORS.text}; color: ${COLORS.card}; padding: 16px 48px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
        Koleksiyonu Keşfet
      </a>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Kampanya Kodu Emaili Preview
 */
export const getCampaignCodePreview = () => {
  const content = `
    ${getEmailHeader('Özel Kampanya')}

    <!-- Gift Icon & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <div style="font-size: 48px; margin: 0 0 20px;">🎁</div>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 10px 0; color: ${COLORS.text}; font-style: italic;">
        Sizin İçin Özel!
      </h2>
      <p style="font-size: 14px; color: ${COLORS.gray}; margin: 0 0 40px;">
        İlk siparişinize özel kampanya kodu
      </p>
    </div>

    <!-- Message -->
    <div style="padding: 0 50px;">
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 30px; font-weight: 300;">
        Sizin için özel bir kampanya kodu hazırladık! İlk siparişinizde kullanabileceğiniz bu kod ile <strong style="color: ${COLORS.gold};">500 bonus puan</strong> kazanma fırsatını yakalayın.
      </p>
    </div>

    <!-- Campaign Code Box -->
    <div style="background: ${COLORS.footerBg}; padding: 40px 50px; text-align: center;">
      <p style="font-size: 10px; color: ${COLORS.gold}; margin: 0 0 15px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
        Kampanya Kodunuz
      </p>
      <div style="background: ${COLORS.card}; padding: 20px; display: inline-block; margin-bottom: 15px;">
        <code style="font-family: 'Courier New', monospace; font-size: 26px; color: ${COLORS.text}; font-weight: bold; letter-spacing: 4px;">
          HOSGELDIN10
        </code>
      </div>
      <p style="font-size: 14px; color: ${COLORS.footerText}; margin: 0;">
        🎉 <strong style="color: ${COLORS.gold};">500 Puan</strong> kazanın!
      </p>
    </div>

    <!-- Expiry & CTA -->
    <div style="padding: 40px 50px;">
      <div style="border-left: 3px solid ${COLORS.gold}; background: #FFF9F0; padding: 16px 20px; margin-bottom: 30px;">
        <p style="font-size: 14px; color: ${COLORS.text}; margin: 0; line-height: 1.6;">
          ⏰ <strong>Son kullanma tarihi:</strong> 31 Ocak 2026
        </p>
      </div>

      <div style="text-align: center;">
        <a href="#" style="display: inline-block; background: ${COLORS.text}; color: ${COLORS.card}; padding: 16px 48px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
          Hemen Alışverişe Başla
        </a>
      </div>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Kampanya Hatırlatma Emaili Preview
 */
export const getCampaignReminderPreview = () => {
  const content = `
    ${getEmailHeader('Son Fırsat')}

    <!-- Urgency Icon & Message -->
    <div style="padding: 0 50px; text-align: center;">
      <div style="font-size: 48px; margin: 0 0 20px;">⏰</div>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; margin: 0 0 10px 0; color: #DC143C; font-style: italic;">
        Son 3 Gün!
      </h2>
      <p style="font-size: 14px; color: ${COLORS.gray}; margin: 0 0 40px;">
        Özel kampanyanızı kullanmayı unutmayın
      </p>
    </div>

    <!-- Message -->
    <div style="padding: 0 50px;">
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 30px; font-weight: 300;">
        Size özel hazırladığımız <strong style="color: ${COLORS.gold};">500 puan</strong> kazandıran kampanya kodunuz <strong>31 Ocak 2026</strong> tarihinde sona eriyor.
      </p>
    </div>

    <!-- Urgent Code Box -->
    <div style="background: #DC143C; padding: 40px 50px; text-align: center;">
      <p style="font-size: 10px; color: rgba(255,255,255,0.8); margin: 0 0 15px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
        Kampanya Kodunuz
      </p>
      <div style="background: ${COLORS.card}; padding: 20px; display: inline-block; margin-bottom: 15px;">
        <code style="font-family: 'Courier New', monospace; font-size: 26px; color: #DC143C; font-weight: bold; letter-spacing: 4px;">
          HOSGELDIN10
        </code>
      </div>
      <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: white; margin: 0; font-weight: bold;">
        Son 3 Gün!
      </p>
    </div>

    <!-- CTA -->
    <div style="padding: 40px 50px; text-align: center;">
      <a href="#" style="display: inline-block; background: #DC143C; color: white; padding: 16px 48px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
        Hemen Kullan
      </a>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Newsletter Hoş Geldin Emaili Preview
 */
export const getNewsletterWelcomePreview = () => {
  const content = `
    ${getEmailHeader()}

    <!-- Welcome Message -->
    <div style="padding: 0 50px; text-align: center;">
      <p style="margin: 0 0 16px; font-size: 10px; letter-spacing: 3px; color: ${COLORS.gold}; text-transform: uppercase;">
        ✦ Hoş Geldin ✦
      </p>
      <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: normal; font-style: italic; color: ${COLORS.text}; line-height: 1.3;">
        Artisan Çikolata<br>Dünyasına Adım Attın
      </h2>
      <p style="margin: 0 0 40px; font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; font-weight: 300;">
        Bundan sonra yeni koleksiyonlar, özel teklifler ve artisan çikolata dünyasından hikayeler seninle.
      </p>
    </div>

    <!-- Discount Box -->
    <div style="background: ${COLORS.footerBg}; padding: 50px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 10px; letter-spacing: 3px; color: ${COLORS.gold}; text-transform: uppercase;">
        İlk Siparişine Özel
      </p>
      <p style="margin: 0 0 4px; font-family: 'Playfair Display', Georgia, serif; font-size: 56px; font-weight: normal; color: ${COLORS.card}; line-height: 1;">
        %10
      </p>
      <p style="margin: 0 0 24px; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-style: italic; color: ${COLORS.gold};">
        indirim
      </p>
      <div style="display: inline-block; border: 1px solid rgba(255,255,255,0.2); padding: 15px 30px;">
        <p style="margin: 0 0 4px; font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.5); text-transform: uppercase;">
          Kod
        </p>
        <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 20px; letter-spacing: 4px; color: ${COLORS.card}; font-weight: bold;">
          HOSGELDIN10
        </p>
      </div>
    </div>

    <!-- Features -->
    <div style="padding: 50px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
        <tr>
          <td width="48%" valign="top">
            <p style="margin: 0 0 8px; font-size: 10px; letter-spacing: 2px; color: ${COLORS.gold}; text-transform: uppercase; font-weight: 600;">
              Koleksiyonlar
            </p>
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${COLORS.gray};">
              Tek menşei kakao çekirdeklerinden üretilen sezonluk ve limitli seriler
            </p>
          </td>
          <td width="4%"></td>
          <td width="48%" valign="top">
            <p style="margin: 0 0 8px; font-size: 10px; letter-spacing: 2px; color: ${COLORS.gold}; text-transform: uppercase; font-weight: 600;">
              Ayrıcalıklar
            </p>
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${COLORS.gray};">
              Abonelere özel erken erişim, indirimler ve sürpriz hediyeler
            </p>
          </td>
        </tr>
      </table>
      <div style="text-align: center;">
        <a href="#" style="display: inline-block; background: ${COLORS.text}; color: ${COLORS.card}; padding: 16px 48px; text-decoration: none; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">
          Koleksiyonu Keşfet
        </a>
      </div>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * EFT Sipariş Bekliyor Emaili Preview
 */
export const getEftOrderPendingPreview = () => {
  const formattedDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const content = `
    ${getEmailHeader('Ödeme Bekleniyor')}

    <!-- Deadline Warning Banner -->
    <div style="background: #FEF3C7; padding: 25px 50px; text-align: center; border-bottom: 3px solid #F59E0B;">
      <p style="font-size: 11px; color: #92400E; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
        ⏰ Ödeme Son Tarihi
      </p>
      <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: #78350F; margin: 0; font-weight: bold;">
        ${formattedDeadline}
      </p>
      <p style="font-size: 13px; color: #92400E; margin: 10px 0 0;">
        Kalan süre: <strong>12 saat</strong>
      </p>
    </div>

    <!-- Greeting -->
    <div style="padding: 40px 50px 0; text-align: center;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: ${COLORS.text}; margin: 0 0 10px; font-style: italic;">
        Siparişiniz Alındı, Ayşe
      </h2>
      <p style="font-size: 12px; color: ${COLORS.gold}; margin: 0 0 30px; letter-spacing: 2px; text-transform: uppercase;">
        Sipariş No: #SADE-ABC123
      </p>
      <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 30px; font-weight: 300;">
        Siparişiniz başarıyla oluşturuldu. Ödemenizi aşağıdaki banka hesabına <strong style="color: ${COLORS.text};">belirtilen süre içinde</strong> yapmanız gerekmektedir.
      </p>
    </div>

    <!-- Amount Box -->
    <div style="background: ${COLORS.footerBg}; padding: 35px 50px; text-align: center;">
      <p style="font-size: 10px; color: ${COLORS.gold}; margin: 0 0 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
        Ödenecek Tutar
      </p>
      <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 42px; color: white; margin: 0; font-weight: bold;">
        ₺908,40
      </p>
      <p style="font-size: 13px; color: ${COLORS.gold}; margin: 10px 0 0;">
        (₺45,00 EFT indirimi uygulandı)
      </p>
    </div>

    <!-- Bank Details -->
    <div style="padding: 40px 50px;">
      <div style="background: ${COLORS.bg}; padding: 25px; margin-bottom: 25px;">
        <h3 style="font-size: 11px; color: ${COLORS.text}; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
          🏦 Banka Hesap Bilgileri
        </h3>
        <div style="background: ${COLORS.card}; padding: 20px; border: 1px solid ${COLORS.divider};">
          <p style="font-size: 15px; font-weight: bold; color: ${COLORS.text}; margin: 0 0 15px;">🏦 Ziraat Bankası</p>
          <table style="width: 100%;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 11px; color: ${COLORS.gray}; padding: 5px 0; text-transform: uppercase; letter-spacing: 1px;">Hesap Sahibi</td>
              <td style="font-size: 14px; color: ${COLORS.text}; padding: 5px 0; text-align: right; font-weight: 600;">Sade Chocolate</td>
            </tr>
            <tr>
              <td style="font-size: 11px; color: ${COLORS.gray}; padding: 5px 0; text-transform: uppercase; letter-spacing: 1px;">IBAN</td>
              <td style="font-family: 'Courier New', monospace; font-size: 12px; color: ${COLORS.text}; padding: 5px 0; text-align: right; letter-spacing: 1px;">TR00 0000 0000 0000 0000 0000 00</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Important Notes -->
      <div style="border-left: 3px solid #F59E0B; background: #FEF3C7; padding: 20px 25px; margin-bottom: 25px;">
        <h4 style="font-size: 11px; color: #92400E; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
          ⚠️ Önemli Bilgiler
        </h4>
        <ul style="font-size: 14px; color: #78350F; margin: 0; padding-left: 20px; line-height: 1.9;">
          <li>Açıklama kısmına mutlaka <strong>#SADE-ABC123</strong> yazın</li>
          <li>Ödeme ${formattedDeadline} tarihine kadar yapılmalıdır</li>
          <li>Süre içinde ödeme yapılmazsa sipariş iptal edilecektir</li>
        </ul>
      </div>

      <!-- Order Summary -->
      <div style="background: ${COLORS.bg}; padding: 25px;">
        <h3 style="font-size: 10px; color: ${COLORS.text}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
          📦 Sipariş Detayı
        </h3>
        <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.divider}; font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: ${COLORS.text};">
              Sade Kutu 16'lı
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.divider}; text-align: center; font-size: 13px; color: ${COLORS.gray};">
              1
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.divider}; text-align: right; font-size: 15px; color: ${COLORS.text}; font-weight: bold;">
              ₺830,00
            </td>
          </tr>
        </table>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${COLORS.divider};">
          <table style="width: 100%;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 13px; color: ${COLORS.gray}; padding: 5px 0;">Ara Toplam</td>
              <td style="font-size: 13px; color: ${COLORS.text}; padding: 5px 0; text-align: right;">₺830,00</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: ${COLORS.gray}; padding: 5px 0;">Kargo</td>
              <td style="font-size: 13px; color: ${COLORS.text}; padding: 5px 0; text-align: right;">₺95,00</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #16A34A; padding: 5px 0;">EFT İndirimi</td>
              <td style="font-size: 13px; color: #16A34A; padding: 5px 0; text-align: right;">-₺45,00</td>
            </tr>
            <tr>
              <td style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: ${COLORS.text}; padding: 12px 0 0; font-weight: bold;">Toplam</td>
              <td style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; color: ${COLORS.text}; padding: 12px 0 0; text-align: right; font-weight: bold;">₺908,40</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    ${getEmailFooter()}
  `;
  return wrapEmail(content);
};

/**
 * Tüm email şablonu önizlemelerini döndüren ana fonksiyon
 */
export const getEmailPreviewHtml = (templateId: string): string => {
  const templates: Record<string, () => string> = {
    order_confirmation: getOrderConfirmationPreview,
    eft_order_pending: getEftOrderPendingPreview,
    payment_success: getPaymentSuccessPreview,
    payment_failed: getPaymentFailedPreview,
    shipping_notification: getShippingNotificationPreview,
    delivery_confirmation: getDeliveryConfirmationPreview,
    order_cancellation: getOrderCancellationPreview,
    welcome: getWelcomePreview,
    campaign_code: getCampaignCodePreview,
    campaign_reminder: getCampaignReminderPreview,
    newsletter_welcome: getNewsletterWelcomePreview,
  };

  const generator = templates[templateId];
  if (generator) {
    return generator();
  }

  return `
    <div style="padding: 40px; text-align: center; font-family: Georgia, serif; color: #666;">
      <p>Şablon önizlemesi bulunamadı</p>
      <p style="font-size: 12px; color: #999;">Template ID: ${templateId}</p>
    </div>
  `;
};
