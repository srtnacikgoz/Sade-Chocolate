// src/services/shippingService.ts
// MNG Kargo API entegrasyonu için client-side service

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

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
 */
export const getMNGCities = async (): Promise<MNGCity[]> => {
  try {
    const getCitiesFn = httpsCallable(functions, 'getCities');
    const result = await getCitiesFn();
    const data = result.data as any;

    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('MNG şehir listesi alınamadı:', error);
    return [];
  }
};

/**
 * MNG Kargo ilçe listesini getirir
 * @param cityCode - Şehir kodu (plaka kodu, örn: "34")
 */
export const getMNGDistricts = async (cityCode: string): Promise<MNGDistrict[]> => {
  try {
    const getDistrictsFn = httpsCallable(functions, 'getDistricts');
    const result = await getDistrictsFn({ cityCode });
    const data = result.data as any;

    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('MNG ilçe listesi alınamadı:', error);
    return [];
  }
};

/**
 * İlçe adına göre MNG ilçe kodunu bulur
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
    console.error('İlçe kodu bulunamadı:', error);
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
 */
export const calculateShipping = async (params: {
  cityCode: string;
  districtCode: string;
  address: string;
  weight?: number;
  desi?: number;
}): Promise<ShippingCost | null> => {
  try {
    const calculateFn = httpsCallable(functions, 'calculateShipping');
    const result = await calculateFn(params);
    const data = result.data as any;

    if (!data.success) {
      return null;
    }

    return {
      total: data.data?.totalPrice || 0,
      currency: 'TRY',
      desi: params.desi || 2,
      weight: params.weight || 1
    };
  } catch (error) {
    console.error('Kargo ücreti hesaplama hatası:', error);
    return null;
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
