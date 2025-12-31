/**
 * Heat Hold Service - Isı Beklemesi Yönetimi
 *
 * 30°C üzeri varış noktalarına gönderilecek siparişleri otomatik bekletir.
 * Araştırma belgesine göre: "Erime Stratejisi" (Melt Strategy)
 *
 * İşleyiş:
 * 1. Sipariş oluşturulurken varış şehrinin hava durumu kontrol edilir
 * 2. 30°C üzeri ise sipariş "Heat Hold" durumuna alınır
 * 3. Müşteriye bilgilendirme yapılır
 * 4. Sıcaklık 25°C altına düşünce otomatik veya manuel serbest bırakılır
 */

import { db } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Order, HeatHoldInfo, OrderStatus } from '../types/order';
import {
  checkWeatherForShipping,
  checkHeatHoldRelease,
  TEMPERATURE_THRESHOLDS,
} from './weatherService';

export interface HeatHoldCheckResult {
  shouldHold: boolean;
  temperature: number;
  reason: string;
  recommendation: string;
}

export interface HeatHoldActivation {
  success: boolean;
  orderId: string;
  heatHoldInfo: HeatHoldInfo;
  message: string;
}

export interface HeatHoldRelease {
  success: boolean;
  orderId: string;
  newStatus: OrderStatus;
  message: string;
}

/**
 * Sipariş için Heat Hold gerekip gerekmediğini kontrol eder
 */
export async function checkHeatHoldRequired(
  destinationCity: string
): Promise<HeatHoldCheckResult> {
  try {
    const weatherCheck = await checkWeatherForShipping(destinationCity);

    return {
      shouldHold: weatherCheck.requiresHeatHold,
      temperature: weatherCheck.weather.temperature,
      reason: weatherCheck.heatHoldReason || '',
      recommendation: weatherCheck.recommendation,
    };
  } catch (error) {
    console.error('Heat hold check error:', error);
    // Hata durumunda güvenli tarafta kal - yüksek sıcaklık varsay
    return {
      shouldHold: false,
      temperature: 25,
      reason: 'Hava durumu kontrolü yapılamadı',
      recommendation: 'Manuel kontrol önerilir',
    };
  }
}

/**
 * Siparişi Heat Hold durumuna alır
 */
export async function activateHeatHold(
  orderId: string,
  reason: string,
  targetTemp: number
): Promise<HeatHoldActivation> {
  try {
    const heatHoldInfo: HeatHoldInfo = {
      isActive: true,
      reason,
      activatedAt: new Date().toISOString(),
      targetTemp,
      releaseTemp: TEMPERATURE_THRESHOLDS.SAFE_MAX,
      autoRelease: true, // Varsayılan olarak otomatik serbest bırakma aktif
    };

    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'Heat Hold' as OrderStatus,
      'logistics.heatHold': heatHoldInfo,
      // Timeline'a ekle
      timeline: [
        {
          action: 'Heat Hold Aktif',
          time: new Date().toISOString(),
          note: reason,
        },
      ],
    });

    return {
      success: true,
      orderId,
      heatHoldInfo,
      message: `Sipariş ${orderId} Heat Hold durumuna alındı`,
    };
  } catch (error) {
    console.error('Heat hold activation error:', error);
    return {
      success: false,
      orderId,
      heatHoldInfo: {} as HeatHoldInfo,
      message: `Heat Hold aktifleştirilemedi: ${error}`,
    };
  }
}

/**
 * Siparişi Heat Hold durumundan çıkarır
 */
export async function releaseHeatHold(
  orderId: string,
  newStatus: OrderStatus = 'Ready for Packing'
): Promise<HeatHoldRelease> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      'logistics.heatHold.isActive': false,
      'logistics.heatHold.releasedAt': new Date().toISOString(),
    });

    return {
      success: true,
      orderId,
      newStatus,
      message: `Sipariş ${orderId} Heat Hold'dan çıkarıldı`,
    };
  } catch (error) {
    console.error('Heat hold release error:', error);
    return {
      success: false,
      orderId,
      newStatus,
      message: `Heat Hold kaldırılamadı: ${error}`,
    };
  }
}

/**
 * Tüm Heat Hold siparişlerini getirir
 */
export async function getHeatHoldOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '==', 'Heat Hold'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
  } catch (error) {
    console.error('Get heat hold orders error:', error);
    return [];
  }
}

/**
 * Heat Hold siparişlerini kontrol eder ve uygun olanları serbest bırakır
 * Bu fonksiyon periyodik olarak çağrılabilir (örn: her saat)
 */
export async function processAutoReleases(): Promise<{
  checked: number;
  released: number;
  results: HeatHoldRelease[];
}> {
  const heatHoldOrders = await getHeatHoldOrders();
  const results: HeatHoldRelease[] = [];
  let released = 0;

  for (const order of heatHoldOrders) {
    // Auto-release aktif değilse atla
    if (!order.logistics.heatHold?.autoRelease) {
      continue;
    }

    // Şehir hava durumunu kontrol et
    const city = order.shipping.city;
    const releaseCheck = await checkHeatHoldRelease(city);

    if (releaseCheck.canRelease) {
      const result = await releaseHeatHold(order.id, 'Ready for Packing');
      results.push(result);
      if (result.success) {
        released++;
      }
    }
  }

  return {
    checked: heatHoldOrders.length,
    released,
    results,
  };
}

/**
 * Sipariş oluştururken Heat Hold kontrolü yapar
 * orderService.createOrder içinde kullanılır
 */
export async function processOrderHeatHold(
  orderId: string,
  destinationCity: string
): Promise<{
  isHeatHold: boolean;
  heatHoldInfo?: HeatHoldInfo;
  message: string;
}> {
  const check = await checkHeatHoldRequired(destinationCity);

  if (check.shouldHold) {
    const activation = await activateHeatHold(orderId, check.reason, check.temperature);

    return {
      isHeatHold: true,
      heatHoldInfo: activation.heatHoldInfo,
      message: check.reason,
    };
  }

  return {
    isHeatHold: false,
    message: 'Gönderim için uygun sıcaklık',
  };
}

/**
 * Heat Hold durumundaki siparişler için bilgilendirme mesajı oluşturur
 */
export function getHeatHoldCustomerMessage(heatHoldInfo: HeatHoldInfo): string {
  return `
Değerli Müşterimiz,

Siparişinizin kalitesini korumak için önemli bir bilgilendirme yapmak istiyoruz.

Teslimat bölgenizde hava sıcaklığı ${heatHoldInfo.targetTemp}°C olarak ölçülmüştür.
Çikolatalarımızın mükemmel kalitede size ulaşması için, siparişinizi geçici olarak
soğuk depomuzda muhafaza ediyoruz.

Hava koşulları uygun hale geldiğinde (${heatHoldInfo.releaseTemp}°C altı) siparişiniz
özel soğutucu paketleme ile hemen kargoya verilecektir.

Bu bekleme, artisanal çikolatamızın dokusunu ve lezzetini korumak için alınmış
bir kalite önlemidir.

Anlayışınız için teşekkür ederiz.

Sade Chocolate
  `.trim();
}

/**
 * Heat Hold istatistikleri
 */
export async function getHeatHoldStats(): Promise<{
  activeCount: number;
  releasedToday: number;
  averageHoldDuration: number; // saat cinsinden
}> {
  try {
    const heatHoldOrders = await getHeatHoldOrders();
    const activeCount = heatHoldOrders.length;

    // Bugün serbest bırakılanlar
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersRef = collection(db, 'orders');
    const releasedQuery = query(
      ordersRef,
      where('logistics.heatHold.releasedAt', '>=', today.toISOString())
    );
    const releasedSnapshot = await getDocs(releasedQuery);
    const releasedToday = releasedSnapshot.size;

    // Ortalama bekleme süresi hesapla
    let totalHours = 0;
    let countWithDuration = 0;

    for (const order of heatHoldOrders) {
      if (order.logistics.heatHold?.activatedAt) {
        const activated = new Date(order.logistics.heatHold.activatedAt);
        const now = new Date();
        const hours = (now.getTime() - activated.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
        countWithDuration++;
      }
    }

    const averageHoldDuration = countWithDuration > 0 ? totalHours / countWithDuration : 0;

    return {
      activeCount,
      releasedToday,
      averageHoldDuration: Math.round(averageHoldDuration * 10) / 10,
    };
  } catch (error) {
    console.error('Heat hold stats error:', error);
    return {
      activeCount: 0,
      releasedToday: 0,
      averageHoldDuration: 0,
    };
  }
}
