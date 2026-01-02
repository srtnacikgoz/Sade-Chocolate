/**
 * Subscription Types - Abonelik Sistemi Tip Tanımları
 *
 * Çikolata Kulübü abonelik modeli:
 * - Tadım Yolculuğu: Aylık farklı single-origin çikolatalar
 * - Gurme Seçki: İki haftada bir premium koleksiyon
 * - Klasik Favoriler: Haftalık en sevilen ürünler
 */

// Abonelik planı
export interface SubscriptionPlan {
  id: string;
  name: string;                    // "Tadım Yolculuğu", "Gurme Seçki"
  description: string;
  shortDescription: string;        // Kart gösterimi için
  price: number;                   // Aylık/periyodik fiyat
  originalPrice?: number;          // İndirimli gösterim için orijinal fiyat
  frequency: SubscriptionFrequency;
  products: SubscriptionProduct[]; // Dahil ürünler
  features: string[];              // Öne çıkan özellikler
  image?: string;                  // Plan görseli
  isActive: boolean;
  isPopular?: boolean;             // "En Popüler" etiketi
  sortOrder: number;               // Sıralama
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionFrequency = 'weekly' | 'bi-weekly' | 'monthly';

export interface SubscriptionProduct {
  productId: string;
  name: string;
  quantity: number;
  isRotating?: boolean;            // Her ay/hafta değişen ürün mü?
}

// Müşteri aboneliği
export interface CustomerSubscription {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  planId: string;
  planName: string;                // Denormalize - hızlı erişim için
  status: SubscriptionStatus;

  // Teslimat bilgileri
  nextDeliveryDate: string;
  deliveryAddress: SubscriptionAddress;
  deliveryPreferences: DeliveryPreferences;

  // Ödeme bilgileri
  paymentMethod: PaymentMethod;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  nextPaymentDate: string;
  failedPaymentAttempts: number;

  // Geçmiş
  deliveryHistory: DeliveryRecord[];
  totalDeliveries: number;
  totalSpent: number;

  // Meta
  createdAt: string;
  updatedAt: string;
  pausedUntil?: string;            // Duraklatma bitiş tarihi
  pauseReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;

  // Özel notlar
  specialInstructions?: string;
  giftSubscription?: boolean;      // Hediye abonelik mi?
  giftRecipient?: GiftRecipient;
}

export type SubscriptionStatus =
  | 'active'           // Aktif abonelik
  | 'paused'           // Geçici durdurulmuş
  | 'cancelled'        // İptal edilmiş
  | 'payment_failed'   // Ödeme başarısız
  | 'pending'          // Onay bekliyor
  | 'expired';         // Süresi dolmuş

export interface SubscriptionAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  addressNote?: string;
}

export interface DeliveryPreferences {
  preferredDay?: PreferredDeliveryDay;
  leaveAtDoor: boolean;
  callBeforeDelivery: boolean;
  specialInstructions?: string;
}

export type PreferredDeliveryDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday';

export type PaymentMethod = 'card' | 'savedCard';

// Teslimat kaydı
export interface DeliveryRecord {
  id: string;
  subscriptionId: string;
  orderId: string;                 // Oluşturulan sipariş ID'si
  deliveryDate: string;
  status: DeliveryStatus;
  products: SubscriptionProduct[];
  amount: number;
  trackingNumber?: string;
  deliveredAt?: string;
  notes?: string;
}

export type DeliveryStatus =
  | 'scheduled'        // Planlandı
  | 'preparing'        // Hazırlanıyor
  | 'shipped'          // Kargoya verildi
  | 'delivered'        // Teslim edildi
  | 'failed'           // Teslimat başarısız
  | 'cancelled';       // İptal edildi

// Ödeme kaydı
export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  status: PaymentStatus;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;          // Ödeme sağlayıcı transaction ID
  failureReason?: string;
  retryCount?: number;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Hediye abonelik
export interface GiftRecipient {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  notifyRecipient: boolean;
}

// Abonelik özeti (liste gösterimi için)
export interface SubscriptionSummary {
  id: string;
  planName: string;
  status: SubscriptionStatus;
  nextDeliveryDate: string;
  price: number;
  frequency: SubscriptionFrequency;
}

// Abonelik oluşturma formu
export interface CreateSubscriptionRequest {
  planId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  deliveryAddress: SubscriptionAddress;
  deliveryPreferences: DeliveryPreferences;
  paymentMethod: PaymentMethod;
  startDate?: string;              // Belirtilmezse hemen başlar
  giftSubscription?: boolean;
  giftRecipient?: GiftRecipient;
  specialInstructions?: string;
}

// Abonelik güncelleme
export interface UpdateSubscriptionRequest {
  deliveryAddress?: SubscriptionAddress;
  deliveryPreferences?: DeliveryPreferences;
  specialInstructions?: string;
}

// Frekans etiketleri (UI için)
export const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  weekly: 'Haftalık',
  'bi-weekly': 'İki Haftada Bir',
  monthly: 'Aylık',
};

// Status etiketleri (UI için)
export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Aktif',
  paused: 'Duraklatıldı',
  cancelled: 'İptal Edildi',
  payment_failed: 'Ödeme Başarısız',
  pending: 'Onay Bekliyor',
  expired: 'Süresi Doldu',
};

// Status renkleri (UI için)
export const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'green',
  paused: 'yellow',
  cancelled: 'red',
  payment_failed: 'red',
  pending: 'blue',
  expired: 'gray',
};
