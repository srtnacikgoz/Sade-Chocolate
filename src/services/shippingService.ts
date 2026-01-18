// src/services/shippingService.ts
// MNG Kargo API entegrasyonu için client-side service
// API çalışmadığında statik verilere fallback yapar

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { TURKEY_CITIES, TURKEY_DISTRICTS, DEFAULT_SHIPPING_COST } from '../data/turkeyData';

// ==========================================
// CBS INFO API - Şehir/İlçe Bilgileri
// ==========================================

export interface MNGCity {
  code: string;
  name: string;
}

export interface MNGDistrict {
  cityCode: string;
  cityName: string;
  code: string;
  name: string;
}

/**
 * MNG Kargo şehir listesini getirir
 * API çalışmazsa statik listeye fallback yapar
 */
export const getMNGCities = async (): Promise<MNGCity[]> => {
  try {
    const getCitiesFn = httpsCallable(functions, 'getCities');
    const result = await getCitiesFn();
    const data = result.data as any;

    if (data.success && data.data?.length > 0) {
      return data.data;
    }
    // Fallback to static data
    console.log('MNG API yanıt vermedi, statik veri kullanılıyor');
    return TURKEY_CITIES;
  } catch (error) {
    console.warn('MNG şehir listesi alınamadı, statik veri kullanılıyor:', error);
    return TURKEY_CITIES;
  }
};

/**
 * MNG Kargo ilçe listesini getirir
 * API çalışmazsa statik listeye fallback yapar
 * @param cityCode - Şehir kodu (plaka kodu, örn: "34")
 */
export const getMNGDistricts = async (cityCode: string): Promise<MNGDistrict[]> => {
  try {
    const getDistrictsFn = httpsCallable(functions, 'getDistricts');
    const result = await getDistrictsFn({ cityCode });
    const data = result.data as any;

    if (data.success && data.data?.length > 0) {
      return data.data;
    }
    // Fallback to static data
    console.log('MNG API yanıt vermedi, statik veri kullanılıyor');
    return TURKEY_DISTRICTS[cityCode] || [];
  } catch (error) {
    console.warn('MNG ilçe listesi alınamadı, statik veri kullanılıyor:', error);
    return TURKEY_DISTRICTS[cityCode] || [];
  }
};

/**
 * İlçe adına göre MNG ilçe kodunu bulur
 * API çalışmazsa null döner (kargo hesaplama sabit ücretle yapılır)
 * @param cityCode - Şehir kodu
 * @param districtName - İlçe adı
 */
export const findMNGDistrictCode = async (cityCode: string, districtName: string): Promise<string | null> => {
  try {
    const findCodeFn = httpsCallable(functions, 'findDistrictCode');
    const result = await findCodeFn({ cityCode, districtName });
    const data = result.data as any;

    if (data.success) {
      return data.data.districtCode;
    }
    console.log('İlçe bulunamadı:', data.availableDistricts);
    return null;
  } catch (error) {
    console.warn('İlçe kodu bulunamadı (MNG API çalışmıyor):', error);
    return null;
  }
};

// Kargo Takip Durumu Tipleri
export interface ShipmentMovement {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

export interface ShipmentStatus {
  referenceId: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';
  statusText: string;
  estimatedDelivery?: string;
  movements: ShipmentMovement[];
}

export interface ShippingCost {
  total: number;
  currency: string;
  desi: number;
  weight: number;
}

export interface ShipmentCreationResult {
  trackingNumber: string;
  barcode: string;
  carrier: string;
  estimatedDelivery?: string;
  shipmentId?: string;
  // API fallback durumunda
  isManual?: boolean;
  apiError?: string;
}

// Status code mapping - MNG API durumlarını Türkçe'ye çevir
const STATUS_MAP: Record<string, { status: ShipmentStatus['status']; text: string }> = {
  'BEKLEMEDE': { status: 'pending', text: 'Kargo hazırlanıyor' },
  'TRANSFER': { status: 'in_transit', text: 'Yolda' },
  'DAGITIMDA': { status: 'out_for_delivery', text: 'Dağıtıma çıktı' },
  'TESLIM_EDILDI': { status: 'delivered', text: 'Teslim edildi' },
  'IADE': { status: 'returned', text: 'İade edildi' },
};

/**
 * Kargo Takibi - Gönderi hareketlerini getirir
 * @param referenceId - Sipariş numarası (SADE-123456)
 */
export const trackShipment = async (referenceId: string): Promise<ShipmentStatus | null> => {
  try {
    const trackShipmentFn = httpsCallable(functions, 'trackShipment');
    const result = await trackShipmentFn({ referenceId });
    const data = result.data as any;

    if (!data.success) {
      console.error('Kargo takip hatası:', data);
      return null;
    }

    // MNG API yanıtını normalize et
    const movements: ShipmentMovement[] = (data.data?.movements || []).map((m: any) => ({
      date: m.date || '',
      time: m.time || '',
      status: m.status || '',
      location: m.location || '',
      description: m.description || ''
    }));

    // Son durumu belirle
    const lastMovement = movements[0];
    const statusInfo = STATUS_MAP[lastMovement?.status] || { status: 'pending', text: 'Beklemede' };

    return {
      referenceId,
      status: statusInfo.status,
      statusText: statusInfo.text,
      estimatedDelivery: data.data?.estimatedDelivery,
      movements
    };
  } catch (error) {
    console.error('Kargo takip hatası:', error);
    return null;
  }
};

/**
 * Gönderi Durumu - Özet bilgi
 * @param referenceId - Sipariş numarası
 */
export const getShipmentStatus = async (referenceId: string): Promise<{ status: string; statusText: string } | null> => {
  try {
    const getStatusFn = httpsCallable(functions, 'getShipmentStatus');
    const result = await getStatusFn({ referenceId });
    const data = result.data as any;

    if (!data.success) {
      return null;
    }

    const statusInfo = STATUS_MAP[data.data?.status] || { status: 'pending', text: 'Beklemede' };
    return {
      status: statusInfo.status,
      statusText: statusInfo.text
    };
  } catch (error) {
    console.error('Durum sorgulama hatası:', error);
    return null;
  }
};

/**
 * Kargo Ücreti Hesaplama
 * API çalışmazsa sabit ücret döner
 */
export const calculateShipping = async (params: {
  cityCode: string;
  districtCode: string;
  address: string;
  weight?: number;
  desi?: number;
}): Promise<ShippingCost | null> => {
  // İlçe kodu yoksa veya geçersizse ('0', '', null) API çağrısı yapma, sabit ücret kullan
  if (!params.districtCode || params.districtCode === '0' || params.districtCode === '') {
    console.log('İlçe kodu yok/geçersiz, sabit kargo ücreti kullanılıyor:', DEFAULT_SHIPPING_COST);
    return {
      total: DEFAULT_SHIPPING_COST,
      currency: 'TRY',
      desi: params.desi || 2,
      weight: params.weight || 1
    };
  }

  try {
    const calculateFn = httpsCallable(functions, 'calculateShipping');
    const result = await calculateFn(params);
    const data = result.data as any;

    if (!data.success) {
      // Fallback to default shipping cost
      console.log('MNG API başarısız, sabit kargo ücreti kullanılıyor:', DEFAULT_SHIPPING_COST);
      return {
        total: DEFAULT_SHIPPING_COST,
        currency: 'TRY',
        desi: params.desi || 2,
        weight: params.weight || 1
      };
    }

    return {
      total: data.data?.totalPrice || DEFAULT_SHIPPING_COST,
      currency: 'TRY',
      desi: params.desi || 2,
      weight: params.weight || 1
    };
  } catch (error) {
    console.warn('Kargo ücreti hesaplama hatası, sabit ücret kullanılıyor:', error);
    return {
      total: DEFAULT_SHIPPING_COST,
      currency: 'TRY',
      desi: params.desi || 2,
      weight: params.weight || 1
    };
  }
};

/**
 * Gönderi Oluşturma - MNG Kargo'da yeni gönderi oluşturur
 * @param params - Gönderi parametreleri
 * @returns Takip numarası ve barkod bilgileri
 */
export const createShipment = async (params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingDistrict?: string;
  weight?: number;
  desi?: number;
  contentDescription?: string;
  coldPackage?: boolean;
}): Promise<ShipmentCreationResult | null> => {
  try {
    const createShipmentFn = httpsCallable(functions, 'createShipment');
    const result = await createShipmentFn(params);
    const data = result.data as any;

    if (!data.success) {
      console.error('Gönderi oluşturma hatası:', data);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('Gönderi oluşturma hatası:', error);
    return null;
  }
};

/**
 * Tek Kargo Durum Kontrolü - Manuel tetikleme
 * @param orderId - Firestore document ID
 */
export const checkSingleShipmentStatus = async (orderId: string): Promise<{
  success: boolean;
  status?: string;
  message: string;
  trackingData?: any;
}> => {
  try {
    const checkFn = httpsCallable(functions, 'checkSingleShipmentStatus');
    const result = await checkFn({ orderId });
    return result.data as any;
  } catch (error: any) {
    console.error('Tek kargo kontrol hatası:', error);
    return { success: false, message: error.message || 'Kontrol başarısız' };
  }
};

/**
 * Toplu Kargo Durum Kontrolü - Tüm shipped siparişleri kontrol eder
 */
export const checkAllShipmentStatus = async (): Promise<{
  success: boolean;
  message: string;
  results?: { checked: number; updated: number; errors: number };
}> => {
  try {
    const checkFn = httpsCallable(functions, 'checkAllShipmentStatus');
    const result = await checkFn();
    return result.data as any;
  } catch (error: any) {
    console.error('Toplu kargo kontrol hatası:', error);
    return { success: false, message: error.message || 'Kontrol başarısız' };
  }
};

// ==========================================
// GELIVER API - Çoklu Kargo Firması Desteği
// ==========================================

export interface GeliverOffer {
  id: string;
  providerName: string;
  providerLogo?: string;
  serviceName: string;
  totalPrice: number;
  currency: string;
  estimatedDeliveryDays?: number;
}

export interface GeliverShipmentResult {
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  shipmentId: string;
  price?: number;
}

/**
 * Geliver ile Kargo Oluştur
 * 10+ kargo firmasından en uygun teklifi otomatik seçer
 */
export const createGeliverShipment = async (params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  weight?: number;
  desi?: number;
  contentDescription?: string;
  autoAccept?: boolean;
}): Promise<GeliverShipmentResult | null> => {
  try {
    const createFn = httpsCallable(functions, 'createGeliverShipment');
    const result = await createFn({
      ...params,
      autoAccept: params.autoAccept ?? true // Varsayılan: en ucuz teklifi otomatik kabul et
    });
    const data = result.data as any;

    if (!data.success) {
      console.error('Geliver gönderi hatası:', data.error);
      return null;
    }

    return data.data;
  } catch (error: any) {
    console.error('Geliver gönderi oluşturma hatası:', error);
    throw new Error(error.message || 'Kargo oluşturulamadı');
  }
};

/**
 * Geliver Tekliflerini Getir
 * Önce shipment oluşturup sonra teklifleri almak için
 */
export const getGeliverOffers = async (shipmentId: string): Promise<GeliverOffer[]> => {
  try {
    const getOffersFn = httpsCallable(functions, 'getGeliverOffers');
    const result = await getOffersFn({ shipmentId });
    const data = result.data as any;

    return data.offers || [];
  } catch (error) {
    console.error('Geliver teklif hatası:', error);
    return [];
  }
};

/**
 * Geliver Teklif Kabul Et
 */
export const acceptGeliverOffer = async (
  shipmentId: string,
  offerId: string
): Promise<GeliverShipmentResult | null> => {
  try {
    const acceptFn = httpsCallable(functions, 'acceptGeliverOffer');
    const result = await acceptFn({ shipmentId, offerId });
    const data = result.data as any;

    return data;
  } catch (error) {
    console.error('Geliver teklif kabul hatası:', error);
    return null;
  }
};

/**
 * Geliver Kargo Takip
 */
export const trackGeliverShipment = async (shipmentId: string): Promise<{
  status: string;
  trackingNumber?: string;
  carrier?: string;
  events: Array<{
    date: string;
    status: string;
    location?: string;
    description?: string;
  }>;
} | null> => {
  try {
    const trackFn = httpsCallable(functions, 'trackGeliverShipment');
    const result = await trackFn({ shipmentId });
    return result.data as any;
  } catch (error) {
    console.error('Geliver takip hatası:', error);
    return null;
  }
};

/**
 * Geliver Şehir Listesi
 */
export const getGeliverCities = async (): Promise<Array<{code: string; name: string}>> => {
  try {
    const getCitiesFn = httpsCallable(functions, 'getGeliverCities');
    const result = await getCitiesFn();
    const data = result.data as any;
    return data.cities || [];
  } catch (error) {
    console.warn('Geliver şehir listesi alınamadı:', error);
    return TURKEY_CITIES;
  }
};

/**
 * Geliver İlçe Listesi
 */
export const getGeliverDistricts = async (cityCode: string): Promise<Array<{code: string; name: string}>> => {
  try {
    const getDistrictsFn = httpsCallable(functions, 'getGeliverDistricts');
    const result = await getDistrictsFn({ cityCode });
    const data = result.data as any;
    return data.districts || [];
  } catch (error) {
    console.warn('Geliver ilçe listesi alınamadı:', error);
    return TURKEY_DISTRICTS[cityCode] || [];
  }
};
