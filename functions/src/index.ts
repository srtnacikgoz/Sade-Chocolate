import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { defineString } from 'firebase-functions/params';
import axios from 'axios';

// Firebase Admin SDK initialization
admin.initializeApp();

// MNG Kargo API Base URL
const MNG_API_BASE = 'https://testapi.mngkargo.com.tr/mngapi/api/standardqueryapi';

// Environment variables (Params API kullanarak)
const MNG_CLIENT_ID = defineString('MNG_CLIENT_ID');
const MNG_CLIENT_SECRET = defineString('MNG_CLIENT_SECRET');
const MNG_JWT_TOKEN = defineString('MNG_JWT_TOKEN', { default: '' }); // Opsiyonel

const getMNGConfig = () => {
  const clientId = MNG_CLIENT_ID.value();
  const clientSecret = MNG_CLIENT_SECRET.value();
  const jwtToken = MNG_JWT_TOKEN.value();

  if (!clientId || !clientSecret) {
    throw new Error('MNG API credentials not configured');
  }

  return {
    clientId,
    clientSecret,
    jwtToken
  };
};

// Helper function to make authenticated requests
const mngRequest = async (endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
  const config = getMNGConfig();

  // Build headers - JWT token opsiyonel
  const headers: any = {
    'X-IBM-Client-Id': config.clientId,
    'X-IBM-Client-Secret': config.clientSecret,
    'Content-Type': 'application/json'
  };

  // Eğer JWT token varsa ekle
  if (config.jwtToken) {
    headers['Authorization'] = `Bearer ${config.jwtToken}`;
  }

  try {
    const response = await axios({
      method,
      url: `${MNG_API_BASE}${endpoint}`,
      headers,
      data
    });

    return response.data;
  } catch (error: any) {
    console.error('MNG API Error:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal',
      error.response?.data?.detail || 'MNG Kargo API hatası',
      error.response?.data
    );
  }
};

/**
 * Kargo Takibi - Gönderi Hareketlerini Getirir
 *
 * @param {string} referenceId - Sipariş numarası (SADE-123456)
 * @returns {Array} Gönderi hareketleri timeline
 */
export const trackShipment = functions.https.onCall(async (request) => {
  const { referenceId } = request.data;

  // Validation
  if (!referenceId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'referenceId parametresi gerekli'
    );
  }

  functions.logger.info('Tracking shipment:', { referenceId });

  const trackingData = await mngRequest(`/trackshipment/${referenceId}`);

  return {
    success: true,
    data: trackingData,
    timestamp: new Date().toISOString()
  };
});

/**
 * Gönderi Durumu - Özet bilgi
 *
 * @param {string} referenceId - Sipariş numarası
 * @returns {Object} Gönderi durum özeti
 */
export const getShipmentStatus = functions.https.onCall(async (request) => {
  const { referenceId } = request.data;

  if (!referenceId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'referenceId parametresi gerekli'
    );
  }

  functions.logger.info('Getting shipment status:', { referenceId });

  const statusData = await mngRequest(`/getshipmentstatus/${referenceId}`);

  return {
    success: true,
    data: statusData,
    timestamp: new Date().toISOString()
  };
});

/**
 * Kargo Ücreti Hesaplama
 *
 * @param {Object} params - Hesaplama parametreleri
 * @returns {Object} Ücret detayları
 */
export const calculateShipping = functions.https.onCall(async (request) => {
  const {
    cityCode,
    districtCode,
    address,
    weight, // kg
    desi
  } = request.data;

  // Validation
  if (!cityCode || !districtCode || !address) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'cityCode, districtCode ve address gerekli'
    );
  }

  const requestBody = {
    shipmentServiceType: 1, // STANDART_TESLİMAT
    packagingType: 3, // PAKET
    paymentType: 1, // GONDERICI_ODER
    pickUpType: 1, // ADRESTEN ALIM
    deliveryType: 1, // ADRESE_TESLIM
    cityCode: parseInt(cityCode),
    districtCode: parseInt(districtCode),
    address,
    smsPreference1: 1, // Varış SMS
    smsPreference2: 1, // Hazırlandı SMS
    smsPreference3: 0, // Gönderici SMS
    orderPieceList: [
      {
        barcode: `TEMP_${Date.now()}`,
        desi: desi || 2,
        kg: weight || 1,
        content: 'Çikolata Ürünleri'
      }
    ]
  };

  functions.logger.info('Calculating shipping cost:', requestBody);

  const calculationData = await mngRequest('/calculate', 'POST', requestBody);

  return {
    success: true,
    data: calculationData,
    timestamp: new Date().toISOString()
  };
});

/**
 * Gönderi Oluşturma - MNG Kargo'da yeni gönderi oluşturur
 *
 * @param {Object} params - Gönderi parametreleri
 * @returns {Object} Takip numarası ve barkod bilgileri
 */
export const createShipment = functions.https.onCall(async (request) => {
  const {
    orderId,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    shippingCity,
    shippingDistrict,
    weight = 1, // kg
    desi = 2,
    contentDescription = 'Çikolata Ürünleri',
    coldPackage = false
  } = request.data;

  // Validation
  if (!orderId || !customerName || !customerPhone || !shippingAddress) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'orderId, customerName, customerPhone ve shippingAddress gerekli'
    );
  }

  // Gönderi oluşturma request body
  const requestBody = {
    referenceId: orderId, // Sipariş ID'yi referans olarak kullan
    shipmentServiceType: 1, // STANDART_TESLİMAT
    packagingType: 3, // PAKET
    paymentType: 1, // GONDERICI_ODER (Sade Chocolate öder)
    pickUpType: 2, // SUBEDEN_ALIM (Şubeden kargo)
    deliveryType: 1, // ADRESE_TESLIM

    // Gönderen Bilgileri (Sade Chocolate)
    sender: {
      name: 'Sade Chocolate',
      phone: '02121234567', // Gerçek telefon numaranız
      email: 'info@sadechocolate.com',
      address: 'Yeşilbahçe Mah. Sanayi Cad. No:123',
      cityCode: 34, // İstanbul
      districtCode: 1809 // Güngören (örnek)
    },

    // Alıcı Bilgileri
    receiver: {
      name: customerName,
      phone: customerPhone.replace(/\D/g, ''), // Sadece rakamlar
      email: customerEmail || '',
      address: shippingAddress,
      cityCode: getCityCode(shippingCity || ''),
      districtCode: getDistrictCode(shippingDistrict || '')
    },

    // Paket Bilgileri
    orderPieceList: [
      {
        barcode: `SADE-${orderId}-${Date.now()}`,
        desi: desi,
        kg: weight,
        content: contentDescription
      }
    ],

    // SMS Bildirimleri
    smsPreference1: 1, // Varış SMS (Alıcıya)
    smsPreference2: 1, // Hazırlandı SMS (Alıcıya)
    smsPreference3: 0, // Gönderici SMS (Kapalı)

    // Özel Notlar
    description: coldPackage ? 'SOĞUK PAKET - ISI HASSAS ÜRÜN' : 'Normal teslimat'
  };

  functions.logger.info('Creating shipment:', { orderId, requestBody });

  try {
    const shipmentData = await mngRequest('/createshipment', 'POST', requestBody);

    return {
      success: true,
      data: {
        trackingNumber: shipmentData.trackingNumber || shipmentData.referenceId,
        barcode: requestBody.orderPieceList[0].barcode,
        carrier: 'MNG Kargo',
        estimatedDelivery: shipmentData.estimatedDeliveryDate,
        shipmentId: shipmentData.shipmentId
      },
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    functions.logger.error('Shipment creation failed:', error);
    throw error;
  }
});

/**
 * Helper: Şehir kodunu döndürür
 */
function getCityCode(cityName: string): number {
  const cityMap: Record<string, number> = {
    'İstanbul': 34,
    'Ankara': 6,
    'İzmir': 35,
    'Bursa': 16,
    'Antalya': 7,
    // ... Diğer şehirler eklenebilir
  };
  return cityMap[cityName] || 34; // Default: İstanbul
}

/**
 * Helper: İlçe kodunu döndürür
 */
function getDistrictCode(districtName: string): number {
  // Gerçek bir uygulamada tam liste olmalı
  return 1809; // Örnek: Güngören
}

/**
 * Health Check - API bağlantısını test eder
 */
export const healthCheck = functions.https.onRequest(async (req, res) => {
  try {
    const config = getMNGConfig();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      configured: !!config.clientId
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ==========================================
// SENDGRID EMAIL FUNCTIONS
// ==========================================

// Email template renkleri
const EMAIL_COLORS = {
  primary: '#4B3832',
  gold: '#C5A059',
  cream: '#FDFCF0',
  text: '#333333',
  lightText: '#666666',
  border: '#E8E4DC',
};

/**
 * Şifre Sıfırlama Emaili - SendGrid ile gönderir
 * Firebase Auth'un generatePasswordResetLink'ini kullanır
 */
export const sendCustomPasswordResetEmail = functions.https.onCall(async (request) => {
  const { email } = request.data;

  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email adresi gerekli'
    );
  }

  try {
    // Firebase Admin SDK ile şifre sıfırlama linki oluştur
    // Firebase Hosting domain'i kullan (authorized domains'de zaten var)
    const actionCodeSettings = {
      url: 'https://sade-chocolate-prod.web.app/#/account',
      handleCodeInApp: false
    };

    const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Sıfırlama</title>
      </head>
      <body style="margin: 0; padding: 0; background: ${EMAIL_COLORS.cream}; font-family: Georgia, serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">

          <!-- Header -->
          <div style="background: ${EMAIL_COLORS.primary}; padding: 48px 20px; text-align: center;">
            <span style="font-family: 'Santana', Georgia, serif; font-size: 42px; color: white; font-weight: bold; letter-spacing: 3px;">SADE</span>
            <p style="font-family: 'Santana', Georgia, serif; font-size: 14px; color: ${EMAIL_COLORS.gold}; margin: 8px 0 0; letter-spacing: 2px;">Chocolate</p>
          </div>

          <!-- Content -->
          <div style="padding: 48px 40px; text-align: center;">
            <!-- Icon -->
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${EMAIL_COLORS.gold} 0%, #D4AF61 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 36px;">🔐</span>
            </div>

            <h1 style="font-family: Georgia, serif; font-size: 28px; color: ${EMAIL_COLORS.primary}; margin: 0 0 16px; font-weight: normal; font-style: italic;">
              Şifre Sıfırlama
            </h1>

            <p style="font-family: Georgia, serif; font-size: 15px; color: ${EMAIL_COLORS.lightText}; line-height: 1.7; margin: 0 0 32px;">
              Hesabınız için bir şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
            </p>

            <!-- CTA Button -->
            <a href="${resetLink}" style="display: inline-block; background: ${EMAIL_COLORS.primary}; color: white; padding: 18px 48px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(75,56,50,0.3);">
              Şifremi Sıfırla
            </a>

            <p style="font-family: Georgia, serif; font-size: 13px; color: ${EMAIL_COLORS.lightText}; margin: 32px 0 0; line-height: 1.6;">
              Bu link <strong>1 saat</strong> içinde geçerliliğini yitirecektir.<br>
              Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
            </p>

            <!-- Link fallback -->
            <div style="margin-top: 32px; padding: 20px; background: ${EMAIL_COLORS.cream}; border-radius: 12px;">
              <p style="font-family: Arial, sans-serif; font-size: 11px; color: ${EMAIL_COLORS.lightText}; margin: 0 0 8px;">
                Buton çalışmıyorsa aşağıdaki linki tarayıcınıza kopyalayın:
              </p>
              <p style="font-family: 'Courier New', monospace; font-size: 10px; color: ${EMAIL_COLORS.primary}; margin: 0; word-break: break-all;">
                ${resetLink}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: ${EMAIL_COLORS.cream}; padding: 32px 20px; text-align: center; border-top: 1px solid ${EMAIL_COLORS.border};">
            <p style="font-family: Georgia, serif; font-size: 12px; color: ${EMAIL_COLORS.lightText}; margin: 0 0 8px;">
              Sade Chocolate<br>
              Yeşilbahçe Mah. Çınarlı Cd. 47/A, Muratpaşa, Antalya
            </p>
            <p style="font-family: Georgia, serif; font-size: 11px; color: #999; margin: 16px 0 0;">
              © 2026 Sade Chocolate. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Firestore mail collection'a yaz (Trigger Email extension gönderecek)
    const db = admin.firestore();
    await db.collection('mail').add({
      to: email,
      message: {
        subject: 'Şifre Sıfırlama - Sade Chocolate',
        html: emailHtml,
        text: `Şifrenizi sıfırlamak için bu linke tıklayın: ${resetLink}`
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    functions.logger.info('Password reset email queued:', { email });

    return {
      success: true,
      message: 'Şifre sıfırlama emaili gönderildi'
    };

  } catch (error: any) {
    functions.logger.error('Password reset error:', error);

    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'not-found',
        'Bu email adresi ile kayıtlı bir hesap bulunamadı'
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      'Şifre sıfırlama emaili gönderilemedi'
    );
  }
});
