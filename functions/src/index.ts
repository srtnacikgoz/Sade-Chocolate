import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';
import axios from 'axios';
import * as iyzicoService from './services/iyzicoService';

// Set global region for all functions
setGlobalOptions({ region: 'europe-west3' });

// Firebase Admin SDK initialization
admin.initializeApp();

// MNG Kargo API Base URLs
const MNG_API_BASE = 'https://api.mngkargo.com.tr/mngapi/api/standardqueryapi';
const MNG_CBS_API_BASE = 'https://api.mngkargo.com.tr/mngapi/api/cbsinfoapi';

// MNG credentials - loaded from .env file in functions directory
const getMNGConfig = () => {
  const clientId = process.env.MNG_CLIENT_ID || '';
  const clientSecret = process.env.MNG_CLIENT_SECRET || '';

  functions.logger.info('MNG Config check:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId.length
  });

  if (!clientId || !clientSecret) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'MNG API credentials not configured in .env file'
    );
  }

  return { clientId, clientSecret };
};

// Helper function to make authenticated requests
const mngRequest = async (endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
  const config = getMNGConfig();

  const headers = {
    'X-IBM-Client-Id': config.clientId,
    'X-IBM-Client-Secret': config.clientSecret,
    'Content-Type': 'application/json'
  };

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
// CBS INFO API - Şehir/İlçe Bilgileri
// ==========================================

// CBS API için helper
const cbsRequest = async (endpoint: string) => {
  const config = getMNGConfig();

  try {
    const response = await axios({
      method: 'GET',
      url: `${MNG_CBS_API_BASE}${endpoint}`,
      headers: {
        'X-IBM-Client-Id': config.clientId,
        'X-IBM-Client-Secret': config.clientSecret,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    functions.logger.error('CBS API Error:', error.response?.data || error.message);
    throw new functions.https.HttpsError(
      'internal',
      error.response?.data?.detail || 'CBS Info API hatası',
      error.response?.data
    );
  }
};

/**
 * Şehir Listesi - MNG Kargo şehir kodlarını getirir
 * Response: [{ code: "01", name: "Adana" }, ...]
 */
export const getCities = functions.https.onCall(async () => {
  functions.logger.info('Fetching cities from CBS API');

  const cities = await cbsRequest('/getcities');

  return {
    success: true,
    data: cities,
    timestamp: new Date().toISOString()
  };
});

/**
 * İlçe Listesi - Şehir koduna göre ilçeleri getirir
 * @param cityCode - Şehir kodu (örn: "34" İstanbul)
 * Response: [{ cityCode: "34", cityName: "İstanbul", code: "1809", name: "Kadıköy" }, ...]
 */
export const getDistricts = functions.https.onCall(async (request) => {
  const { cityCode } = request.data;

  if (!cityCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'cityCode parametresi gerekli'
    );
  }

  functions.logger.info('Fetching districts for city:', { cityCode });

  const districts = await cbsRequest(`/getdistricts/${cityCode}`);

  return {
    success: true,
    data: districts,
    timestamp: new Date().toISOString()
  };
});

/**
 * Mahalle Listesi - Şehir ve ilçe koduna göre mahalleleri getirir
 */
export const getNeighborhoods = functions.https.onCall(async (request) => {
  const { cityCode, districtCode } = request.data;

  if (!cityCode || !districtCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'cityCode ve districtCode parametreleri gerekli'
    );
  }

  functions.logger.info('Fetching neighborhoods:', { cityCode, districtCode });

  const neighborhoods = await cbsRequest(`/getneighborhoods/${cityCode}/${districtCode}`);

  return {
    success: true,
    data: neighborhoods,
    timestamp: new Date().toISOString()
  };
});

/**
 * İlçe Kodu Bul - İlçe adına göre kod bulur
 * Checkout'ta kullanmak için
 */
export const findDistrictCode = functions.https.onCall(async (request) => {
  const { cityCode, districtName } = request.data;

  if (!cityCode || !districtName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'cityCode ve districtName parametreleri gerekli'
    );
  }

  functions.logger.info('Finding district code:', { cityCode, districtName });

  const districts = await cbsRequest(`/getdistricts/${cityCode}`);

  // İlçe adını normalize et (büyük/küçük harf, Türkçe karakterler)
  const normalizedName = districtName.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  const found = districts.find((d: any) => {
    const dName = d.name.toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    return dName === normalizedName || dName.includes(normalizedName) || normalizedName.includes(dName);
  });

  if (found) {
    return {
      success: true,
      data: {
        cityCode: found.cityCode,
        cityName: found.cityName,
        districtCode: found.code,
        districtName: found.name
      },
      timestamp: new Date().toISOString()
    };
  }

  return {
    success: false,
    error: 'İlçe bulunamadı',
    availableDistricts: districts.map((d: any) => d.name),
    timestamp: new Date().toISOString()
  };
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

// ============================================================
// İYZİCO PAYMENT GATEWAY FUNCTIONS
// ============================================================

/**
 * İyzico Checkout Form Başlatma
 *
 * @param {Object} data - {orderId: string}
 * @param {Object} context - Firebase auth context
 * @returns {Object} {token, checkoutFormContent, tokenExpireTime}
 */
export const initializeIyzicoPayment = functions.https.onCall(async (request: any) => {
    const { orderId } = request.data;

    // Validation
    if (!orderId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId parametresi gerekli'
      );
    }

    functions.logger.info('İyzico payment initialize request:', { orderId });

    try {
      // Firestore'dan order bilgisini al
      const db = admin.firestore();
      const orderDoc = await db.collection('orders').doc(orderId).get();

      if (!orderDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Sipariş bulunamadı'
        );
      }

      const orderData = orderDoc.data() as any;

      // Order validation
      if (orderData.payment?.status !== 'pending') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Sipariş zaten ödenmiş veya işlem sırasında'
        );
      }

      if (orderData.payment?.method !== 'card') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Bu sipariş kart ödemesi için oluşturulmamış'
        );
      }

      // İyzico Checkout Form başlat
      const result = await iyzicoService.initializeCheckoutForm(orderData);

      // Order'a token bilgisini ekle (tracking için)
      await orderDoc.ref.update({
        'payment.iyzicoToken': result.token,
        'payment.tokenExpireTime': result.tokenExpireTime,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      functions.logger.info('İyzico payment initialized:', {
        orderId,
        token: result.token
      });

      return {
        success: true,
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        tokenExpireTime: result.tokenExpireTime,
        paymentPageUrl: result.paymentPageUrl
      };

    } catch (error: any) {
      functions.logger.error('İyzico payment initialize error:', error);

      // İyzico HttpsError zaten fırlatılıyorsa, olduğu gibi fırlat
      if (error.code && error.code.startsWith('functions/')) {
        throw error;
      }

      // Diğer hatalar için generic error
      throw new functions.https.HttpsError(
        'internal',
        'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
        error.message
      );
    }
  });

/**
 * İyzico Webhook Callback Handler
 *
 * @param {Request} req - HTTP request (POST from İyzico)
 * @param {Response} res - HTTP response
 */
export const handleIyzicoCallback = functions.https.onRequest(async (req: any, res: any) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { token } = req.body;

      if (!token) {
        functions.logger.error('İyzico callback: token eksik');
        res.status(400).send('Token gerekli');
        return;
      }

      functions.logger.info('İyzico callback alındı:', { token });

      // İyzico'dan payment result al
      const paymentResult = await iyzicoService.retrieveCheckoutForm(token);

      const orderId = paymentResult.basketId; // conversationId olarak göndermiştik

      if (!orderId) {
        functions.logger.error('İyzico callback: orderId bulunamadı', paymentResult);
        res.status(400).send('Order ID bulunamadı');
        return;
      }

      // Firestore'dan order al (sipariş numarasına göre query)
      const db = admin.firestore();
      const ordersQuery = await db.collection('orders')
        .where('id', '==', orderId)
        .limit(1)
        .get();

      if (ordersQuery.empty) {
        functions.logger.error('İyzico callback: order bulunamadı', { orderId });
        res.status(404).send('Sipariş bulunamadı');
        return;
      }

      const orderDoc = ordersQuery.docs[0];
      const firestoreOrderId = orderDoc.id; // Firestore document ID

      // Duplicate payment check (aynı token 2x işlenmesin)
      const orderData = orderDoc.data() as any;
      if (orderData.payment?.iyzicoPaymentId === paymentResult.paymentId) {
        functions.logger.warn('İyzico callback: duplicate payment', {
          orderId,
          firestoreOrderId,
          paymentId: paymentResult.paymentId
        });
        // Zaten işlenmiş, success redirect
        res.redirect(`https://sadechocolate.com/?payment=success&orderId=${firestoreOrderId}`);
        return;
      }

      // Payment details extract et
      const paymentDetails = iyzicoService.extractPaymentDetails(paymentResult);

      // Payment başarılı mı?
      const isSuccess = paymentResult.status === 'success' && paymentResult.paymentStatus === 'SUCCESS';

      // Firestore update
      const updateData: any = {
        'payment.status': isSuccess ? 'paid' : 'failed',
        'payment.iyzicoPaymentId': paymentDetails.iyzicoPaymentId,
        'payment.iyzicoToken': paymentDetails.iyzicoToken,
        'payment.cardFamily': paymentDetails.cardFamily,
        'payment.cardAssociation': paymentDetails.cardAssociation,
        'payment.lastFourDigits': paymentDetails.lastFourDigits,
        'payment.installment': paymentDetails.installment,
        'payment.paidPrice': paymentDetails.paidPrice,
        'payment.merchantCommissionRate': paymentDetails.merchantCommissionRate,
        'payment.iyzicoCommissionFee': paymentDetails.iyzicoCommissionFee,
        'payment.failureReason': paymentDetails.failureReason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (isSuccess) {
        updateData.status = 'processing'; // Sipariş durumu: hazırlanmaya başladı
        updateData.paymentConfirmedAt = admin.firestore.FieldValue.serverTimestamp();

        // Timeline ekle
        updateData.timeline = admin.firestore.FieldValue.arrayUnion({
          action: 'Ödeme alındı',
          time: new Date().toISOString(),
          note: `${paymentDetails.cardAssociation} **** ${paymentDetails.lastFourDigits}`
        });
      } else {
        // Failed payment
        updateData['payment.retryCount'] = admin.firestore.FieldValue.increment(1);
        updateData['payment.lastRetryAt'] = admin.firestore.FieldValue.serverTimestamp();
      }

      await orderDoc.ref.update(updateData);

      functions.logger.info('İyzico payment processed:', {
        orderId,
        status: isSuccess ? 'success' : 'failed',
        paymentId: paymentDetails.iyzicoPaymentId
      });

      // Email gönder (arka planda, hata tolere edilir)
      const sendPaymentEmail = async () => {
        try {
          const customerEmail = orderData.customer?.email;
          const customerName = orderData.customer?.name || 'Değerli Müşterimiz';

          if (!customerEmail) {
            functions.logger.warn('Email gönderilemedi: customer email yok', { orderId });
            return;
          }

          // Marka renkleri
          const COLORS = {
            primary: '#4B3832',
            gold: '#C5A059',
            cream: '#FDFCF0',
            text: '#333333',
            lightText: '#666666',
            border: '#E8E4DC'
          };

          // Email header
          const emailHeader = (badge: string) => `
            <div style="background: ${COLORS.primary}; padding: 48px 20px; text-align: center;">
              <img src="https://sadechocolate.com/images/email-logo-dark.png" alt="Sade Chocolate" width="280" height="50" style="display: block; margin: 0 auto; max-width: 100%; height: auto;" />
              <div style="display: inline-block; background: ${COLORS.gold}; color: ${COLORS.primary}; padding: 10px 24px; border-radius: 30px; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-top: 20px; text-transform: uppercase;">
                ${badge}
              </div>
            </div>
          `;

          // Email footer
          const emailFooter = `
            <div style="background: ${COLORS.cream}; padding: 40px 20px; text-align: center; border-top: 1px solid ${COLORS.border};">
              <p style="font-family: Georgia, serif; font-size: 12px; color: ${COLORS.lightText}; margin: 0 0 8px; line-height: 1.6;">
                Sade Chocolate<br>
                Yeşilbahçe Mah. Çınarlı Cd. 47/A<br>
                Muratpaşa, Antalya 07160
              </p>
              <p style="font-family: Georgia, serif; font-size: 12px; color: ${COLORS.lightText}; margin: 16px 0;">
                Sorularınız için: <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.gold}; text-decoration: none;">bilgi@sadechocolate.com</a>
              </p>
              <p style="font-family: Georgia, serif; font-size: 11px; color: #999; margin: 16px 0 0;">
                © 2026 Sade Chocolate. Tüm hakları saklıdır.
              </p>
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

          let emailHtml: string;
          let emailSubject: string;

          if (isSuccess) {
            // Payment Success Email
            const cardDisplayText = paymentDetails.cardAssociation && paymentDetails.lastFourDigits
              ? `${paymentDetails.cardAssociation} **** ${paymentDetails.lastFourDigits}`
              : 'Kredi Kartı';

            const itemsHtml = (orderData.items || []).map((item: any) => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text};">
                  ${item.name}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; text-align: center; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.lightText};">
                  ${item.quantity}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-family: Georgia, serif; font-size: 14px; color: ${COLORS.primary}; font-weight: bold;">
                  ₺${(item.price || 0).toFixed(2)}
                </td>
              </tr>
            `).join('');

            const total = orderData.payment?.total || 0;
            const subtotal = orderData.payment?.subtotal || 0;
            const shipping = orderData.payment?.shipping || 0;

            emailSubject = `Ödeme Onaylandı - Sipariş #${orderId}`;
            emailHtml = wrapEmail(`
              ${emailHeader('Ödeme Onaylandı')}
              <div style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); padding: 48px 20px; text-align: center;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); border-radius: 50%; margin: 0 auto 20px; line-height: 80px;">
                  <span style="font-size: 40px; color: white;">✓</span>
                </div>
                <h1 style="font-family: Georgia, serif; font-size: 28px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
                  Ödemeniz Başarılı!
                </h1>
                <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; margin: 0;">
                  ${cardDisplayText} ile ödeme tamamlandı
                </p>
              </div>
              <div style="padding: 48px 40px;">
                <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 16px;">
                  Merhaba ${customerName},
                </p>
                <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 24px;">
                  <strong style="color: ${COLORS.gold};">#${orderId}</strong> numaralı siparişinizin ödemesi başarıyla tamamlandı. Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir.
                </p>
                <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                    <thead>
                      <tr>
                        <th style="text-align: left; padding: 10px 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase;">Ürün</th>
                        <th style="text-align: center; padding: 10px 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase;">Adet</th>
                        <th style="text-align: right; padding: 10px 12px; border-bottom: 2px solid ${COLORS.primary}; font-family: Arial, sans-serif; font-size: 10px; color: ${COLORS.primary}; text-transform: uppercase;">Fiyat</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                  </table>
                </div>
                <div style="background: ${COLORS.primary}; border-radius: 16px; padding: 24px; color: white;">
                  <table style="width: 100%;" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0;">Ara Toplam</td>
                      <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0; text-align: right;">₺${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0;">Kargo</td>
                      <td style="font-family: Georgia, serif; font-size: 14px; padding: 6px 0; text-align: right;">${shipping === 0 ? 'Ücretsiz' : '₺' + shipping.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 12px 0 6px;"><div style="border-top: 1px solid rgba(255,255,255,0.2);"></div></td>
                    </tr>
                    <tr>
                      <td style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: ${COLORS.gold};">Ödenen Tutar</td>
                      <td style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; text-align: right; color: ${COLORS.gold};">₺${total.toFixed(2)}</td>
                    </tr>
                  </table>
                </div>
                <div style="text-align: center; margin: 40px 0 20px;">
                  <a href="https://sadechocolate.com/#/account?view=orders" style="display: inline-block; background: ${COLORS.primary}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
                    Siparişi Takip Et
                  </a>
                </div>
              </div>
              ${emailFooter}
            `);
          } else {
            // Payment Failed Email
            const total = orderData.payment?.total || 0;
            const retryUrl = `https://sadechocolate.com/checkout?orderId=${orderId}&retry=true`;
            const errorMessage = paymentDetails.failureReason || 'Kart bilgilerinizi kontrol ediniz veya farklı bir kart deneyiniz.';

            emailSubject = `Ödeme Tamamlanamadı - Sipariş #${orderId}`;
            emailHtml = wrapEmail(`
              ${emailHeader('Ödeme Başarısız')}
              <div style="background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); padding: 48px 20px; text-align: center;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF5350 0%, #E53935 100%); border-radius: 50%; margin: 0 auto 20px; line-height: 80px;">
                  <span style="font-size: 40px; color: white;">!</span>
                </div>
                <h1 style="font-family: Georgia, serif; font-size: 28px; color: ${COLORS.primary}; margin: 0 0 8px; font-weight: normal; font-style: italic;">
                  Ödeme Tamamlanamadı
                </h1>
                <p style="font-family: Georgia, serif; font-size: 15px; color: ${COLORS.lightText}; margin: 0;">
                  Sipariş #${orderId}
                </p>
              </div>
              <div style="padding: 48px 40px;">
                <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 16px;">
                  Merhaba ${customerName},
                </p>
                <p style="font-family: Georgia, serif; font-size: 16px; color: ${COLORS.lightText}; line-height: 1.8; margin: 0 0 24px;">
                  <strong style="color: ${COLORS.gold};">₺${total.toFixed(2)}</strong> tutarındaki ödemeniz tamamlanamadı. Siparişiniz beklemede olup, ödemeyi tekrar deneyebilirsiniz.
                </p>
                <div style="background: #FFEBEE; border-left: 4px solid #EF5350; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                  <h4 style="font-family: Arial, sans-serif; font-size: 12px; color: #C62828; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">
                    Hata Detayı
                  </h4>
                  <p style="font-family: Georgia, serif; font-size: 14px; color: #B71C1C; margin: 0; line-height: 1.6;">
                    ${errorMessage}
                  </p>
                </div>
                <div style="background: ${COLORS.cream}; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                  <h3 style="font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.primary}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">
                    💡 Öneriler
                  </h3>
                  <ul style="font-family: Georgia, serif; font-size: 14px; color: ${COLORS.text}; margin: 0; padding-left: 20px; line-height: 2;">
                    <li>Kart bilgilerinizi kontrol edin</li>
                    <li>Kartınızda yeterli bakiye olduğundan emin olun</li>
                    <li>Farklı bir kart deneyebilirsiniz</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 40px 0 20px;">
                  <a href="${retryUrl}" style="display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
                    Ödemeyi Tekrar Dene
                  </a>
                </div>
              </div>
              ${emailFooter}
            `);
          }

          // Firestore mail collection'a ekle (Firebase Trigger Email extension)
          await db.collection('mail').add({
            to: customerEmail,
            from: 'Sade Chocolate <bilgi@sadechocolate.com>',
            message: {
              subject: emailSubject,
              html: emailHtml
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          functions.logger.info('Payment email kuyruğa eklendi:', { orderId, isSuccess });
        } catch (emailError) {
          // Email hatası ana akışı engellememeli
          functions.logger.error('Payment email hatası:', emailError);
        }
      };

      // Email'i arka planda gönder (await yok, hata tolere edilir)
      sendPaymentEmail().catch(err => functions.logger.error('Email background error:', err));

      // Redirect (Firestore document ID kullan)
      if (isSuccess) {
        res.redirect(`https://sadechocolate.com/?payment=success&orderId=${firestoreOrderId}`);
      } else {
        res.redirect(`https://sadechocolate.com/?payment=failed&orderId=${firestoreOrderId}&error=${encodeURIComponent(paymentDetails.failureReason || 'Ödeme başarısız')}`);
      }

    } catch (error: any) {
      functions.logger.error('İyzico callback error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

/**
 * Retry Payment (Opsiyonel)
 *
 * @param {Object} data - {orderId: string}
 * @returns {Object} - New checkout form
 */
export const retryPayment = functions.https.onCall(async (request: any) => {
    const { orderId } = request.data;

    if (!orderId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId parametresi gerekli'
      );
    }

    try {
      const db = admin.firestore();
      const orderDoc = await db.collection('orders').doc(orderId).get();

      if (!orderDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Sipariş bulunamadı'
        );
      }

      const orderData = orderDoc.data() as any;

      // Sadece failed veya pending siparişler için retry
      if (orderData.payment?.status === 'paid') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Bu sipariş zaten ödenmiş'
        );
      }

      // Payment status'u pending yap
      await orderDoc.ref.update({
        'payment.status': 'pending',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Yeni checkout form oluştur (initializeIyzicoPayment ile aynı)
      const result = await iyzicoService.initializeCheckoutForm(orderData);

      await orderDoc.ref.update({
        'payment.iyzicoToken': result.token,
        'payment.tokenExpireTime': result.tokenExpireTime
      });

      functions.logger.info('Payment retry başlatıldı:', { orderId });

      return {
        success: true,
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        tokenExpireTime: result.tokenExpireTime
      };

    } catch (error: any) {
      functions.logger.error('Retry payment error:', error);

      if (error.code && error.code.startsWith('functions/')) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Ödeme yeniden başlatılamadı',
        error.message
      );
    }
  });

// ============================================================
// ADMIN AUTHENTICATION - Firebase Custom Claims
// ============================================================

// Admin master key - Environment variable'dan alınır (ilk kurulum için)
const getAdminMasterKey = () => process.env.ADMIN_MASTER_KEY || '';

/**
 * Admin Claim Ekleme
 * Yeni bir kullanıcıya admin yetkisi verir
 *
 * @param {string} targetEmail - Admin yapılacak kullanıcının emaili
 * @param {string} masterKey - Güvenlik anahtarı (ilk kurulum için)
 * @returns {Object} - İşlem sonucu
 */
export const setAdminClaim = functions.https.onCall(async (request: any) => {
  const { targetEmail, masterKey } = request.data;
  const callerUid = request.auth?.uid;

  // Validation
  if (!targetEmail) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'targetEmail parametresi gerekli'
    );
  }

  // Authorization check - ya mevcut admin ya da master key
  let isAuthorized = false;

  // 1. Master key ile yetkilendirme (ilk kurulum için)
  const configuredMasterKey = getAdminMasterKey();
  if (masterKey && configuredMasterKey && masterKey === configuredMasterKey) {
    isAuthorized = true;
    functions.logger.info('Admin claim: Master key ile yetkilendirme', { targetEmail });
  }

  // 2. Mevcut admin ile yetkilendirme
  if (!isAuthorized && callerUid) {
    try {
      const callerUser = await admin.auth().getUser(callerUid);
      if (callerUser.customClaims?.admin === true) {
        isAuthorized = true;
        functions.logger.info('Admin claim: Mevcut admin ile yetkilendirme', {
          callerEmail: callerUser.email,
          targetEmail
        });
      }
    } catch (error) {
      functions.logger.error('Caller user fetch error:', error);
    }
  }

  if (!isAuthorized) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Bu işlem için yetkiniz yok'
    );
  }

  try {
    // Target user'ı email ile bul
    const targetUser = await admin.auth().getUserByEmail(targetEmail);

    // Custom claim ekle
    await admin.auth().setCustomUserClaims(targetUser.uid, {
      ...targetUser.customClaims,
      admin: true,
      adminGrantedAt: new Date().toISOString()
    });

    // Firestore'da admin kaydı oluştur (audit log)
    const db = admin.firestore();
    await db.collection('admin_users').doc(targetUser.uid).set({
      email: targetEmail,
      uid: targetUser.uid,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      grantedBy: callerUid || 'master_key',
      active: true
    });

    functions.logger.info('Admin claim başarıyla eklendi:', { targetEmail, targetUid: targetUser.uid });

    return {
      success: true,
      message: `${targetEmail} artık admin`,
      uid: targetUser.uid
    };

  } catch (error: any) {
    functions.logger.error('setAdminClaim error:', error);

    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'not-found',
        'Bu email ile kayıtlı kullanıcı bulunamadı'
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      'Admin yetkisi eklenemedi',
      error.message
    );
  }
});

/**
 * Admin Claim Kaldırma
 * Bir kullanıcının admin yetkisini kaldırır
 *
 * @param {string} targetEmail - Admin yetkisi kaldırılacak kullanıcı
 * @returns {Object} - İşlem sonucu
 */
export const removeAdminClaim = functions.https.onCall(async (request: any) => {
  const { targetEmail } = request.data;
  const callerUid = request.auth?.uid;

  if (!targetEmail) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'targetEmail parametresi gerekli'
    );
  }

  // Sadece mevcut admin kaldırabilir
  if (!callerUid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Giriş yapmalısınız'
    );
  }

  const callerUser = await admin.auth().getUser(callerUid);
  if (callerUser.customClaims?.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Bu işlem için admin yetkisi gerekli'
    );
  }

  try {
    const targetUser = await admin.auth().getUserByEmail(targetEmail);

    // Kendi yetkisini kaldıramaz (güvenlik)
    if (targetUser.uid === callerUid) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Kendi admin yetkinizi kaldıramazsınız'
      );
    }

    // Admin claim'i kaldır
    const currentClaims = targetUser.customClaims || {};
    delete currentClaims.admin;
    delete currentClaims.adminGrantedAt;
    await admin.auth().setCustomUserClaims(targetUser.uid, currentClaims);

    // Firestore kaydını güncelle
    const db = admin.firestore();
    await db.collection('admin_users').doc(targetUser.uid).update({
      active: false,
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: callerUid
    });

    functions.logger.info('Admin claim kaldırıldı:', { targetEmail, targetUid: targetUser.uid });

    return {
      success: true,
      message: `${targetEmail} artık admin değil`
    };

  } catch (error: any) {
    functions.logger.error('removeAdminClaim error:', error);

    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'not-found',
        'Kullanıcı bulunamadı'
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      'Admin yetkisi kaldırılamadı',
      error.message
    );
  }
});

/**
 * Admin Durumu Kontrolü
 * Kullanıcının admin olup olmadığını kontrol eder
 *
 * @returns {Object} - Admin durumu
 */
export const checkAdminStatus = functions.https.onCall(async (request: any) => {
  const callerUid = request.auth?.uid;

  if (!callerUid) {
    return {
      isAdmin: false,
      reason: 'not_authenticated'
    };
  }

  try {
    const user = await admin.auth().getUser(callerUid);
    const isAdmin = user.customClaims?.admin === true;

    return {
      isAdmin,
      email: user.email,
      adminGrantedAt: user.customClaims?.adminGrantedAt || null
    };

  } catch (error: any) {
    functions.logger.error('checkAdminStatus error:', error);
    return {
      isAdmin: false,
      reason: 'error'
    };
  }
});

/**
 * Admin Listesi
 * Tüm admin kullanıcılarını listeler (sadece adminler görebilir)
 *
 * @returns {Array} - Admin listesi
 */
export const listAdmins = functions.https.onCall(async (request: any) => {
  const callerUid = request.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Giriş yapmalısınız'
    );
  }

  const callerUser = await admin.auth().getUser(callerUid);
  if (callerUser.customClaims?.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Bu işlem için admin yetkisi gerekli'
    );
  }

  try {
    const db = admin.firestore();
    const adminsSnapshot = await db.collection('admin_users')
      .where('active', '==', true)
      .get();

    const admins = adminsSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      admins
    };

  } catch (error: any) {
    functions.logger.error('listAdmins error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Admin listesi alınamadı'
    );
  }
});
