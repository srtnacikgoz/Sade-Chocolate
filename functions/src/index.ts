import * as functions from 'firebase-functions';
import { defineString } from 'firebase-functions/params';
import axios from 'axios';

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
