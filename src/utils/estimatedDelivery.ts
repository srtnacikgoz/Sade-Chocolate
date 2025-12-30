import { Order } from '../components/admin/tabs/OrdersTab';
import { addDays, addHours, isWeekend, nextMonday } from 'date-fns';

/**
 * Order Cycle Time (OCT) - Siparişin hazırlanma ve kargoya verilme süresi
 * Lüks çikolata için butik üretim süreci dikkate alınır
 */
const ORDER_CYCLE_TIME = {
  pending: 24, // 24 saat - Sipariş onay ve hazırlık
  processing: 48, // 48 saat - Üretim ve paketleme (el işçiliği)
  shipped: 0, // Kargoda - süre kargo firmasına bağlı
  delivered: 0,
  cancelled: 0,
};

/**
 * Kargo teslimat süreleri (saat cinsinden)
 * Antalya merkezli teslimat varsayımı
 */
const SHIPPING_DURATION = {
  local: 24, // Antalya içi - 1 gün
  regional: 48, // Akdeniz bölgesi - 2 gün
  national: 72, // Türkiye geneli - 3 gün
  remote: 96, // Uzak bölgeler - 4 gün
};

/**
 * Hava durumu faktörü
 * Sıcak havalarda ekstra soğutma ve paketleme süresi
 */
const WEATHER_DELAY_HOURS = 12;

/**
 * Hafta sonu faktörü
 * Hafta sonları işlem yapılmaz
 */
const applyWeekendAdjustment = (date: Date): Date => {
  if (isWeekend(date)) {
    return nextMonday(date);
  }
  return date;
};

/**
 * Adres bazlı bölge tespiti
 * Gerçek bir sistemde geocoding API kullanılabilir
 */
const getShippingRegion = (address: string): keyof typeof SHIPPING_DURATION => {
  const addressLower = address.toLowerCase();

  // Antalya içi
  if (addressLower.includes('antalya')) {
    return 'local';
  }

  // Akdeniz bölgesi
  if (
    addressLower.includes('muğla') ||
    addressLower.includes('mersin') ||
    addressLower.includes('adana') ||
    addressLower.includes('hatay')
  ) {
    return 'regional';
  }

  // Uzak bölgeler
  if (
    addressLower.includes('hakkari') ||
    addressLower.includes('van') ||
    addressLower.includes('ağrı') ||
    addressLower.includes('kars')
  ) {
    return 'remote';
  }

  // Varsayılan: Türkiye geneli
  return 'national';
};

/**
 * Dinamik teslimat tarihi hesaplama (EDD - Estimated Delivery Date)
 *
 * Formül:
 * EDD = Sipariş Tarihi + Order Cycle Time + Shipping Duration + Weather Factor + Weekend Adjustment
 */
export const calculateEstimatedDeliveryDate = (order: Order): Date => {
  const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);

  // Eğer zaten teslim edildiyse, gerçek teslimat tarihini döndür
  if (order.status === 'delivered' && order.logistics?.actualDeliveryDate) {
    return order.logistics.actualDeliveryDate;
  }

  // Eğer iptal edildiyse, null döndür
  if (order.status === 'cancelled') {
    return orderDate;
  }

  // 1. Order Cycle Time (Hazırlık süresi)
  const cycleTime = ORDER_CYCLE_TIME[order.status] || 0;
  let estimatedDate = addHours(orderDate, cycleTime);

  // 2. Kargo süresi (sadece pending ve processing durumlarında)
  if (order.status === 'pending' || order.status === 'processing') {
    const region = getShippingRegion(order.customerInfo.address);
    const shippingDuration = SHIPPING_DURATION[region];
    estimatedDate = addHours(estimatedDate, shippingDuration);
  }

  // 3. Kargoya verilmişse, shipping date'ten itibaren hesapla
  if (order.status === 'shipped' && order.logistics?.shippedAt) {
    const shippedDate = order.logistics.shippedAt;
    const region = getShippingRegion(order.customerInfo.address);
    const shippingDuration = SHIPPING_DURATION[region];
    estimatedDate = addHours(shippedDate, shippingDuration);
  }

  // 4. Hava durumu faktörü (buz aküsü gerekliyse)
  if (order.weatherAlert?.requiresIce) {
    estimatedDate = addHours(estimatedDate, WEATHER_DELAY_HOURS);
  }

  // 5. Hafta sonu düzeltmesi
  estimatedDate = applyWeekendAdjustment(estimatedDate);

  return estimatedDate;
};

/**
 * Teslimat durumu emoji ve mesajı
 */
export const getDeliveryStatus = (order: Order) => {
  const edd = calculateEstimatedDeliveryDate(order);
  const now = new Date();
  const hoursUntilDelivery = (edd.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (order.status === 'delivered') {
    return {
      emoji: '✅',
      status: 'Teslim Edildi',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    };
  }

  if (order.status === 'cancelled') {
    return {
      emoji: '❌',
      status: 'İptal Edildi',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    };
  }

  if (hoursUntilDelivery < 24) {
    return {
      emoji: '🚀',
      status: 'Bugün Teslim',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    };
  }

  if (hoursUntilDelivery < 48) {
    return {
      emoji: '📦',
      status: 'Yarın Teslim',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    };
  }

  const daysUntilDelivery = Math.ceil(hoursUntilDelivery / 24);
  return {
    emoji: '🕐',
    status: `${daysUntilDelivery} Gün İçinde`,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  };
};

/**
 * Perfect Order Rate (POR) hesaplama
 * Mükemmel Sipariş Oranı: Zamanında, eksiksiz ve hasarsız teslimat
 */
export const isPerfectOrder = (order: Order): boolean => {
  if (order.status !== 'delivered') {
    return false;
  }

  const edd = calculateEstimatedDeliveryDate(order);
  const actualDelivery = order.logistics?.actualDeliveryDate;

  if (!actualDelivery) {
    return false;
  }

  // Tahmini tarihten önce veya aynı gün teslim edilmişse mükemmel
  return actualDelivery <= edd;
};
