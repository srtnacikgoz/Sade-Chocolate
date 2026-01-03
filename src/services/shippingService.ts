// src/services/shippingService.ts
// MNG Kargo API entegrasyonu için client-side service

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

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
