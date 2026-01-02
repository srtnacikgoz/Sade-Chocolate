/**
 * Shipping Utilities - Blackout Days & Shipping Date Calculations
 *
 * Çikolata lojistiği için gönderim kuralları:
 * - Cuma, Cumartesi, Pazar günleri kargolama yapılmaz (Blackout Days)
 * - Hafta sonu depoda bekleyen ürünler erime riski taşır
 * - Siparişler sadece Pazartesi-Perşembe arası kargoya verilir
 */

export interface BlackoutCheckResult {
  isBlackoutDay: boolean;
  originalDate: Date;
  scheduledShipDate: Date;
  delayDays: number;
  reason: string;
}

export interface ShippingWindowInfo {
  canShipToday: boolean;
  nextAvailableDate: Date;
  shippingWindow: string;
  message: string;
}

// Türkiye lokalizasyonu için gün isimleri
const DAY_NAMES_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/**
 * Verilen tarihin blackout günü olup olmadığını kontrol eder
 * Blackout günleri: Cuma (5), Cumartesi (6), Pazar (0)
 */
export function isBlackoutDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  // 0 = Pazar, 5 = Cuma, 6 = Cumartesi
  return dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
}

/**
 * Verilen tarihten sonraki ilk uygun gönderim gününü hesaplar
 * Uygun günler: Pazartesi (1), Salı (2), Çarşamba (3), Perşembe (4)
 */
export function getNextShippingDate(fromDate: Date): Date {
  const result = new Date(fromDate);

  // Blackout günü değilse aynı günü döndür
  if (!isBlackoutDay(result)) {
    return result;
  }

  // Sonraki uygun güne ilerle
  while (isBlackoutDay(result)) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

/**
 * Sipariş tarihi için blackout kontrolü yapar ve detaylı sonuç döndürür
 */
export function calculateBlackoutDelay(orderDate: Date): BlackoutCheckResult {
  const originalDate = new Date(orderDate);
  const scheduledShipDate = getNextShippingDate(originalDate);

  const isBlackout = isBlackoutDay(originalDate);
  const delayDays = Math.ceil(
    (scheduledShipDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let reason = '';
  if (isBlackout) {
    const dayName = DAY_NAMES_TR[originalDate.getDay()];
    reason = `${dayName} günü kargolama yapılmamaktadır. Siparişiniz ${DAY_NAMES_TR[scheduledShipDate.getDay()]} günü kargoya verilecektir.`;
  }

  return {
    isBlackoutDay: isBlackout,
    originalDate,
    scheduledShipDate,
    delayDays,
    reason
  };
}

/**
 * Bugün için gönderim penceresi bilgisini döndürür
 */
export function getShippingWindowInfo(checkDate: Date = new Date()): ShippingWindowInfo {
  const canShipToday = !isBlackoutDay(checkDate);
  const nextAvailableDate = getNextShippingDate(checkDate);

  // Gönderim penceresi string'i oluştur
  const shippingWindow = canShipToday ? 'Pazartesi-Perşembe' : 'Pazartesi-Perşembe (Ertelendi)';

  let message = '';
  if (canShipToday) {
    message = 'Siparişiniz bugün kargoya verilebilir.';
  } else {
    const dayName = DAY_NAMES_TR[nextAvailableDate.getDay()];
    const formattedDate = formatDateTR(nextAvailableDate);
    message = `Siparişiniz ${dayName}, ${formattedDate} tarihinde kargoya verilecektir.`;
  }

  return {
    canShipToday,
    nextAvailableDate,
    shippingWindow,
    message
  };
}

/**
 * Tarihi Türkçe formatında döndürür (1 Ocak 2025)
 */
export function formatDateTR(date: Date): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Tahmini teslimat tarihini hesaplar
 * Gönderim tarihine kargo süresi ekler (varsayılan 2-3 iş günü)
 */
export function calculateEstimatedDelivery(
  shipDate: Date,
  deliveryDays: number = 3
): Date {
  const result = new Date(shipDate);
  let addedDays = 0;

  while (addedDays < deliveryDays) {
    result.setDate(result.getDate() + 1);
    // Hafta sonlarını atla (kargo teslimat yapmaz varsayımı)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }

  return result;
}

/**
 * Express kargo için özel hesaplama (24 saat içinde teslimat)
 * Blackout kontrolü + express window
 */
export function calculateExpressDelivery(orderDate: Date): {
  shipDate: Date;
  deliveryDate: Date;
  isExpressAvailable: boolean;
  message: string;
} {
  const shipDate = getNextShippingDate(orderDate);
  const deliveryDate = new Date(shipDate);
  deliveryDate.setDate(deliveryDate.getDate() + 1);

  // Express sadece Pazartesi-Çarşamba siparişleri için geçerli
  // (Perşembe siparişi Cuma teslimatı gerektirir, riskli)
  const isExpressAvailable = shipDate.getDay() >= 1 && shipDate.getDay() <= 3;

  let message = '';
  if (isExpressAvailable) {
    message = `Express teslimat: ${formatDateTR(deliveryDate)} (24 saat içinde)`;
  } else {
    message = 'Express teslimat bu sipariş için uygun değil. Standart kargo önerilir.';
  }

  return {
    shipDate,
    deliveryDate,
    isExpressAvailable,
    message
  };
}

/**
 * Yaz mevsimi kontrolü (Mayıs-Eylül arası)
 * Soğutucu hesaplaması için kullanılır
 */
export function isSummerSeason(date: Date = new Date()): boolean {
  const month = date.getMonth(); // 0-indexed
  // Mayıs (4) - Eylül (8)
  return month >= 4 && month <= 8;
}

/**
 * Sonraki X iş günü için tarih listesi döndürür
 * Takvim gösterimi için kullanışlı
 */
export function getNextBusinessDays(count: number, fromDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  const current = new Date(fromDate);

  while (dates.length < count) {
    if (!isBlackoutDay(current)) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
