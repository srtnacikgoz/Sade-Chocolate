/**
 * Geliver Kargo API Service
 * https://docs.geliver.io
 *
 * Tek API ile 10+ kargo firmasına erişim:
 * Aras, Yurtiçi, PTT, Sürat, HepsiJet, MNG, Kolay Gelsin...
 */

import axios, { AxiosInstance } from 'axios';
import * as functions from 'firebase-functions';

// Geliver API Base URL
const GELIVER_API_BASE = 'https://api.geliver.io/api/v1';

// Geliver Client singleton
let geliverClient: AxiosInstance | null = null;

// Sender Address cache
let cachedSenderAddressId: string | null = null;

/**
 * Geliver API Client oluştur
 */
const getGeliverClient = (): AxiosInstance => {
  if (geliverClient) return geliverClient;

  const token = process.env.GELIVER_API_TOKEN;
  if (!token) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'GELIVER_API_TOKEN not configured in .env'
    );
  }

  geliverClient = axios.create({
    baseURL: GELIVER_API_BASE,
    timeout: 30000,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return geliverClient;
};

/**
 * Geliver API Request Helper
 */
const geliverRequest = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> => {
  const client = getGeliverClient();

  try {
    const response = await client.request({
      method,
      url: endpoint,
      data
    });

    // Geliver API returns { result: boolean, data: ... }
    if (response.data?.result === false) {
      throw new Error(response.data?.message || 'Geliver API error');
    }

    return response.data?.data || response.data;
  } catch (error: any) {
    functions.logger.error('Geliver API Error:', {
      endpoint,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    throw new functions.https.HttpsError(
      'internal',
      error.response?.data?.message || error.message || 'Geliver API hatası',
      error.response?.data
    );
  }
};

// ==========================================
// TYPES
// ==========================================

export interface GeliverAddress {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  address1: string;
  address2?: string;
  countryCode: string;
  cityName: string;
  cityCode?: string;
  districtName: string;
  zip?: string;
}

export interface GeliverShipment {
  id: string;
  status: string;
  trackingNumber?: string;
  labelUrl?: string;
  carrier?: string;
  offers?: GeliverOffer[];
}

export interface GeliverOffer {
  id: string;
  providerName: string;
  providerLogo?: string;
  serviceName: string;
  totalPrice: number;
  currency: string;
  estimatedDeliveryDays?: number;
}

export interface GeliverTrackingEvent {
  date: string;
  status: string;
  location?: string;
  description?: string;
}

// ==========================================
// SENDER ADDRESS
// ==========================================

/**
 * Sade Chocolate gönderici adresini oluştur veya mevcut olanı getir
 */
export const getOrCreateSenderAddress = async (): Promise<string> => {
  // Cache'te varsa kullan
  if (cachedSenderAddressId) {
    return cachedSenderAddressId;
  }

  // Mevcut adresleri kontrol et
  try {
    const addresses = await geliverRequest<any[]>('GET', '/addresses/sender');

    // "Sade Chocolate" adresini bul
    const existing = addresses?.find((a: any) =>
      a.name?.toLowerCase().includes('sade') ||
      a.email?.includes('sadechocolate')
    );

    if (existing?.id) {
      cachedSenderAddressId = existing.id;
      functions.logger.info('Existing sender address found:', existing.id);
      return existing.id;
    }
  } catch (err) {
    functions.logger.warn('Could not fetch existing addresses, creating new one');
  }

  // Yeni adres oluştur
  const senderAddress: GeliverAddress = {
    name: 'Sade Chocolate',
    email: 'bilgi@sadechocolate.com',
    phone: '05333420493',
    address1: 'Yeşilbahçe mah. Çınarlı cd 47/A',
    countryCode: 'TR',
    cityName: 'Antalya',
    cityCode: '07',
    districtName: 'Muratpaşa',
    zip: '07100'
  };

  const result = await geliverRequest<any>('POST', '/addresses/sender', senderAddress);
  cachedSenderAddressId = result.id;

  functions.logger.info('New sender address created:', result.id);
  return result.id;
};

// ==========================================
// SHIPMENT OPERATIONS
// ==========================================

/**
 * Yeni gönderi oluştur
 */
export const createGeliverShipment = async (params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  weight?: number; // kg
  desi?: number;
  contentDescription?: string;
}): Promise<GeliverShipment> => {
  const {
    orderId,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    shippingCity,
    shippingDistrict,
    weight = 1,
    desi = 2,
    contentDescription = 'Çikolata Ürünleri'
  } = params;

  // Gönderici adresini al
  const senderAddressId = await getOrCreateSenderAddress();

  // Desi'den boyut hesapla (yaklaşık)
  const sideLength = Math.cbrt(desi * 3000); // cm

  // Gönderi oluştur
  const shipmentData = {
    senderAddressID: senderAddressId,
    recipientAddress: {
      name: customerName,
      email: customerEmail || '',
      phone: customerPhone.replace(/\D/g, ''),
      address1: shippingAddress,
      countryCode: 'TR',
      cityName: shippingCity,
      districtName: shippingDistrict
    },
    // Boyutlar string olmalı (Geliver API requirement)
    length: String(Math.round(sideLength)),
    width: String(Math.round(sideLength)),
    height: String(Math.round(sideLength)),
    distanceUnit: 'cm',
    weight: String(weight),
    massUnit: 'kg',
    // Ek bilgiler
    orderNumber: orderId,
    description: contentDescription
  };

  functions.logger.info('Creating Geliver shipment:', {
    orderId,
    senderAddressId,
    city: shippingCity,
    district: shippingDistrict
  });

  // Test ortamında createTest, production'da create kullan
  const isProduction = process.env.NODE_ENV === 'production' ||
                       process.env.FUNCTIONS_EMULATOR !== 'true';

  const endpoint = isProduction ? '/shipments' : '/shipments/test';
  const shipment = await geliverRequest<GeliverShipment>('POST', endpoint, shipmentData);

  functions.logger.info('Geliver shipment created:', {
    id: shipment.id,
    status: shipment.status
  });

  return shipment;
};

/**
 * Gönderi detaylarını getir
 */
export const getGeliverShipment = async (shipmentId: string): Promise<GeliverShipment> => {
  return await geliverRequest<GeliverShipment>('GET', `/shipments/${shipmentId}`);
};

/**
 * Gönderi tekliflerini getir
 */
export const getShipmentOffers = async (shipmentId: string): Promise<GeliverOffer[]> => {
  const shipment = await getGeliverShipment(shipmentId);
  return shipment.offers || [];
};

/**
 * Teklifi kabul et ve etiket al
 */
export const acceptOffer = async (
  shipmentId: string,
  offerId: string
): Promise<{
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
}> => {
  const result = await geliverRequest<any>('POST', `/transactions/accept`, {
    shipmentId,
    offerId
  });

  // Güncel shipment bilgisini al
  const shipment = await getGeliverShipment(shipmentId);

  return {
    trackingNumber: shipment.trackingNumber || result.trackingNumber || '',
    labelUrl: shipment.labelUrl || result.labelUrl || '',
    carrier: shipment.carrier || result.providerName || 'Geliver'
  };
};

/**
 * En uygun teklifi otomatik seç ve kabul et
 */
export const autoAcceptBestOffer = async (shipmentId: string): Promise<{
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  price: number;
}> => {
  // Teklifleri bekle (async olabilir)
  let offers: GeliverOffer[] = [];
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    offers = await getShipmentOffers(shipmentId);
    if (offers && offers.length > 0) break;

    // 2 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  if (!offers || offers.length === 0) {
    throw new functions.https.HttpsError(
      'not-found',
      'Kargo firmasından teklif alınamadı. Lütfen daha sonra tekrar deneyin.'
    );
  }

  // En ucuz teklifi seç
  const bestOffer = offers.reduce((best, current) =>
    current.totalPrice < best.totalPrice ? current : best
  );

  functions.logger.info('Auto-accepting best offer:', {
    shipmentId,
    offerId: bestOffer.id,
    carrier: bestOffer.providerName,
    price: bestOffer.totalPrice
  });

  const result = await acceptOffer(shipmentId, bestOffer.id);

  return {
    ...result,
    price: bestOffer.totalPrice
  };
};

// ==========================================
// TRACKING
// ==========================================

/**
 * Kargo takip bilgilerini getir
 */
export const trackGeliverShipment = async (shipmentId: string): Promise<{
  status: string;
  trackingNumber?: string;
  carrier?: string;
  events: GeliverTrackingEvent[];
}> => {
  const shipment = await geliverRequest<any>('GET', `/shipments/${shipmentId}/tracking`);

  return {
    status: shipment.status || 'unknown',
    trackingNumber: shipment.trackingNumber,
    carrier: shipment.carrier,
    events: shipment.events || shipment.trackingHistory || []
  };
};

// ==========================================
// GEO (Şehir/İlçe)
// ==========================================

/**
 * Türkiye şehirlerini getir
 */
export const getGeliverCities = async (): Promise<Array<{code: string; name: string}>> => {
  return await geliverRequest<any[]>('GET', '/geo/cities?countryCode=TR');
};

/**
 * Şehrin ilçelerini getir
 */
export const getGeliverDistricts = async (cityCode: string): Promise<Array<{code: string; name: string}>> => {
  return await geliverRequest<any[]>('GET', `/geo/districts?cityCode=${cityCode}`);
};

// ==========================================
// WEBHOOKS
// ==========================================

/**
 * Webhook kaydet (durum değişikliği bildirimi için)
 */
export const registerWebhook = async (callbackUrl: string): Promise<string> => {
  const result = await geliverRequest<any>('POST', '/webhooks', {
    url: callbackUrl,
    events: ['shipment.status_changed', 'shipment.delivered', 'shipment.returned']
  });

  return result.id;
};
