/**
 * Subscription Service - Abonelik Yönetimi
 *
 * Çikolata Kulübü abonelik sistemi:
 * - Plan yönetimi (CRUD)
 * - Müşteri abonelikleri
 * - Teslimat yönetimi
 * - Manuel ödeme takibi (Iyzico entegrasyonu sonra eklenebilir)
 */

import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import {
  SubscriptionPlan,
  CustomerSubscription,
  SubscriptionStatus,
  DeliveryRecord,
  PaymentRecord,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionFrequency,
} from '../types/subscription';
import { getNextShippingDate } from '../utils/shippingUtils';

// Collection names
const PLANS_COLLECTION = 'subscription_plans';
const SUBSCRIPTIONS_COLLECTION = 'customer_subscriptions';
const DELIVERIES_COLLECTION = 'subscription_deliveries';
const PAYMENTS_COLLECTION = 'subscription_payments';

// =====================
// PLAN YÖNETİMİ
// =====================

/**
 * Tüm aktif abonelik planlarını getirir
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const plansRef = collection(db, PLANS_COLLECTION);
    const q = query(plansRef, where('isActive', '==', true), orderBy('sortOrder'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SubscriptionPlan[];
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return [];
  }
}

/**
 * Tek bir plan getirir
 */
export async function getSubscriptionPlanById(planId: string): Promise<SubscriptionPlan | null> {
  try {
    const planRef = doc(db, PLANS_COLLECTION, planId);
    const snapshot = await getDoc(planRef);

    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as SubscriptionPlan;
  } catch (error) {
    console.error('Get subscription plan error:', error);
    return null;
  }
}

/**
 * Yeni plan oluşturur
 */
export async function createSubscriptionPlan(
  plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const planData = {
      ...plan,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, PLANS_COLLECTION), planData);
    return docRef.id;
  } catch (error) {
    console.error('Create subscription plan error:', error);
    throw error;
  }
}

/**
 * Plan günceller
 */
export async function updateSubscriptionPlan(
  planId: string,
  updates: Partial<SubscriptionPlan>
): Promise<void> {
  try {
    const planRef = doc(db, PLANS_COLLECTION, planId);
    await updateDoc(planRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    throw error;
  }
}

/**
 * Plan siler (soft delete - isActive: false)
 */
export async function deleteSubscriptionPlan(planId: string): Promise<void> {
  try {
    await updateSubscriptionPlan(planId, { isActive: false });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    throw error;
  }
}

// =====================
// MÜŞTERİ ABONELİKLERİ
// =====================

/**
 * Yeni abonelik oluşturur
 */
export async function createSubscription(
  request: CreateSubscriptionRequest
): Promise<string> {
  try {
    const plan = await getSubscriptionPlanById(request.planId);
    if (!plan) throw new Error('Plan bulunamadı');

    const now = new Date();
    const startDate = request.startDate ? new Date(request.startDate) : now;
    const nextDeliveryDate = calculateNextDeliveryDate(startDate, plan.frequency);
    const nextPaymentDate = calculateNextPaymentDate(startDate, plan.frequency);

    const subscription: Omit<CustomerSubscription, 'id'> = {
      customerId: request.customerId,
      customerEmail: request.customerEmail,
      customerName: request.customerName,
      planId: request.planId,
      planName: plan.name,
      status: 'active',

      nextDeliveryDate: nextDeliveryDate.toISOString(),
      deliveryAddress: request.deliveryAddress,
      deliveryPreferences: request.deliveryPreferences,

      paymentMethod: request.paymentMethod,
      nextPaymentDate: nextPaymentDate.toISOString(),
      failedPaymentAttempts: 0,

      deliveryHistory: [],
      totalDeliveries: 0,
      totalSpent: 0,

      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),

      specialInstructions: request.specialInstructions,
      giftSubscription: request.giftSubscription,
      giftRecipient: request.giftRecipient,
    };

    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), subscription);
    return docRef.id;
  } catch (error) {
    console.error('Create subscription error:', error);
    throw error;
  }
}

/**
 * Müşterinin aboneliklerini getirir
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<CustomerSubscription[]> {
  try {
    const subsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const q = query(subsRef, where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CustomerSubscription[];
  } catch (error) {
    console.error('Get customer subscriptions error:', error);
    return [];
  }
}

/**
 * Tek bir abonelik getirir
 */
export async function getSubscriptionById(
  subscriptionId: string
): Promise<CustomerSubscription | null> {
  try {
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const snapshot = await getDoc(subRef);

    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as CustomerSubscription;
  } catch (error) {
    console.error('Get subscription error:', error);
    return null;
  }
}

/**
 * Aboneliği duraklatır
 */
export async function pauseSubscription(
  subscriptionId: string,
  until?: Date,
  reason?: string
): Promise<void> {
  try {
    const updates: Partial<CustomerSubscription> = {
      status: 'paused',
      pauseReason: reason,
      updatedAt: new Date().toISOString(),
    };

    if (until) {
      updates.pausedUntil = until.toISOString();
    }

    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subRef, updates);
  } catch (error) {
    console.error('Pause subscription error:', error);
    throw error;
  }
}

/**
 * Aboneliği devam ettirir
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  try {
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) throw new Error('Abonelik bulunamadı');

    const plan = await getSubscriptionPlanById(subscription.planId);
    if (!plan) throw new Error('Plan bulunamadı');

    const now = new Date();
    const nextDeliveryDate = calculateNextDeliveryDate(now, plan.frequency);

    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subRef, {
      status: 'active',
      pausedUntil: null,
      pauseReason: null,
      nextDeliveryDate: nextDeliveryDate.toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    throw error;
  }
}

/**
 * Aboneliği iptal eder
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason: string
): Promise<void> {
  try {
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subRef, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
}

/**
 * Abonelik teslimat/iletişim bilgilerini günceller
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: UpdateSubscriptionRequest
): Promise<void> {
  try {
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    throw error;
  }
}

// =====================
// TESLİMAT YÖNETİMİ
// =====================

/**
 * Yaklaşan teslimatları getirir (önümüzdeki 7 gün)
 */
export async function getUpcomingDeliveries(): Promise<CustomerSubscription[]> {
  try {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const subsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const q = query(
      subsRef,
      where('status', '==', 'active'),
      where('nextDeliveryDate', '<=', weekLater.toISOString()),
      orderBy('nextDeliveryDate')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CustomerSubscription[];
  } catch (error) {
    console.error('Get upcoming deliveries error:', error);
    return [];
  }
}

/**
 * Teslimat siparişi oluşturur
 * Not: Bu fonksiyon orderService.createOrder ile entegre edilmeli
 */
export async function createDeliveryOrder(
  subscription: CustomerSubscription
): Promise<string> {
  try {
    const plan = await getSubscriptionPlanById(subscription.planId);
    if (!plan) throw new Error('Plan bulunamadı');

    const now = new Date();

    // Teslimat kaydı oluştur
    const deliveryRecord: Omit<DeliveryRecord, 'id'> = {
      subscriptionId: subscription.id,
      orderId: '', // Sipariş oluşturulduktan sonra güncellenecek
      deliveryDate: subscription.nextDeliveryDate,
      status: 'scheduled',
      products: plan.products,
      amount: plan.price,
    };

    const deliveryRef = await addDoc(collection(db, DELIVERIES_COLLECTION), deliveryRecord);

    // Aboneliği güncelle - sonraki teslimat tarihini hesapla
    const nextDeliveryDate = calculateNextDeliveryDate(now, plan.frequency);
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscription.id);

    await updateDoc(subRef, {
      totalDeliveries: subscription.totalDeliveries + 1,
      totalSpent: subscription.totalSpent + plan.price,
      nextDeliveryDate: nextDeliveryDate.toISOString(),
      updatedAt: now.toISOString(),
    });

    return deliveryRef.id;
  } catch (error) {
    console.error('Create delivery order error:', error);
    throw error;
  }
}

/**
 * Teslimat durumunu günceller
 */
export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryRecord['status'],
  orderId?: string,
  trackingNumber?: string
): Promise<void> {
  try {
    const deliveryRef = doc(db, DELIVERIES_COLLECTION, deliveryId);
    const updates: Partial<DeliveryRecord> = { status };

    if (orderId) updates.orderId = orderId;
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (status === 'delivered') updates.deliveredAt = new Date().toISOString();

    await updateDoc(deliveryRef, updates);
  } catch (error) {
    console.error('Update delivery status error:', error);
    throw error;
  }
}

/**
 * Teslimat tamamlandı olarak işaretler
 */
export async function markDeliveryCompleted(
  subscriptionId: string,
  deliveryId: string
): Promise<void> {
  await updateDeliveryStatus(deliveryId, 'delivered');
}

// =====================
// ÖDEME YÖNETİMİ (Manuel)
// =====================

/**
 * Manuel ödeme kaydı oluşturur
 */
export async function recordManualPayment(
  subscriptionId: string,
  amount: number,
  transactionId?: string
): Promise<string> {
  try {
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) throw new Error('Abonelik bulunamadı');

    const plan = await getSubscriptionPlanById(subscription.planId);
    if (!plan) throw new Error('Plan bulunamadı');

    const now = new Date();

    // Ödeme kaydı oluştur
    const payment: Omit<PaymentRecord, 'id'> = {
      subscriptionId,
      amount,
      status: 'completed',
      paymentDate: now.toISOString(),
      paymentMethod: subscription.paymentMethod,
      transactionId,
    };

    const paymentRef = await addDoc(collection(db, PAYMENTS_COLLECTION), payment);

    // Aboneliği güncelle
    const nextPaymentDate = calculateNextPaymentDate(now, plan.frequency);
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);

    await updateDoc(subRef, {
      lastPaymentDate: now.toISOString(),
      lastPaymentAmount: amount,
      nextPaymentDate: nextPaymentDate.toISOString(),
      failedPaymentAttempts: 0,
      status: 'active', // Ödeme başarısız durumundan çıkar
      updatedAt: now.toISOString(),
    });

    return paymentRef.id;
  } catch (error) {
    console.error('Record manual payment error:', error);
    throw error;
  }
}

/**
 * Ödeme geçmişini getirir
 */
export async function getPaymentHistory(subscriptionId: string): Promise<PaymentRecord[]> {
  try {
    const paymentsRef = collection(db, PAYMENTS_COLLECTION);
    const q = query(
      paymentsRef,
      where('subscriptionId', '==', subscriptionId),
      orderBy('paymentDate', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PaymentRecord[];
  } catch (error) {
    console.error('Get payment history error:', error);
    return [];
  }
}

/**
 * Başarısız ödeme kaydeder
 */
export async function recordPaymentFailure(
  subscriptionId: string,
  reason: string
): Promise<void> {
  try {
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) return;

    const newAttempts = subscription.failedPaymentAttempts + 1;
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);

    // 3 başarısız denemeden sonra aboneliği askıya al
    const newStatus: SubscriptionStatus = newAttempts >= 3 ? 'payment_failed' : subscription.status;

    await updateDoc(subRef, {
      failedPaymentAttempts: newAttempts,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // Başarısız ödeme kaydı
    await addDoc(collection(db, PAYMENTS_COLLECTION), {
      subscriptionId,
      amount: 0,
      status: 'failed',
      paymentDate: new Date().toISOString(),
      paymentMethod: subscription.paymentMethod,
      failureReason: reason,
      retryCount: newAttempts,
    });
  } catch (error) {
    console.error('Record payment failure error:', error);
  }
}

// =====================
// İSTATİSTİKLER
// =====================

/**
 * Abonelik istatistikleri
 */
export async function getSubscriptionStats(): Promise<{
  totalActive: number;
  totalPaused: number;
  totalCancelled: number;
  monthlyRevenue: number;
  upcomingDeliveries: number;
}> {
  try {
    const subsRef = collection(db, SUBSCRIPTIONS_COLLECTION);

    // Aktif abonelikler
    const activeQuery = query(subsRef, where('status', '==', 'active'));
    const activeSnapshot = await getDocs(activeQuery);
    const totalActive = activeSnapshot.size;

    // Duraklatılmış
    const pausedQuery = query(subsRef, where('status', '==', 'paused'));
    const pausedSnapshot = await getDocs(pausedQuery);
    const totalPaused = pausedSnapshot.size;

    // İptal edilmiş
    const cancelledQuery = query(subsRef, where('status', '==', 'cancelled'));
    const cancelledSnapshot = await getDocs(cancelledQuery);
    const totalCancelled = cancelledSnapshot.size;

    // Aylık gelir hesapla (aktif aboneliklerden)
    let monthlyRevenue = 0;
    for (const doc of activeSnapshot.docs) {
      const sub = doc.data() as CustomerSubscription;
      const plan = await getSubscriptionPlanById(sub.planId);
      if (plan) {
        // Frekansa göre aylık değere çevir
        const monthlyValue = plan.frequency === 'weekly' ? plan.price * 4
          : plan.frequency === 'bi-weekly' ? plan.price * 2
          : plan.price;
        monthlyRevenue += monthlyValue;
      }
    }

    // Yaklaşan teslimatlar
    const upcomingDeliveries = (await getUpcomingDeliveries()).length;

    return {
      totalActive,
      totalPaused,
      totalCancelled,
      monthlyRevenue: Math.round(monthlyRevenue),
      upcomingDeliveries,
    };
  } catch (error) {
    console.error('Get subscription stats error:', error);
    return {
      totalActive: 0,
      totalPaused: 0,
      totalCancelled: 0,
      monthlyRevenue: 0,
      upcomingDeliveries: 0,
    };
  }
}

// =====================
// YARDIMCI FONKSİYONLAR
// =====================

/**
 * Sonraki teslimat tarihini hesaplar (Blackout Days kontrolü ile)
 */
function calculateNextDeliveryDate(fromDate: Date, frequency: SubscriptionFrequency): Date {
  const result = new Date(fromDate);

  switch (frequency) {
    case 'weekly':
      result.setDate(result.getDate() + 7);
      break;
    case 'bi-weekly':
      result.setDate(result.getDate() + 14);
      break;
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      break;
  }

  // Blackout günü kontrolü
  return getNextShippingDate(result);
}

/**
 * Sonraki ödeme tarihini hesaplar
 */
function calculateNextPaymentDate(fromDate: Date, frequency: SubscriptionFrequency): Date {
  const result = new Date(fromDate);

  switch (frequency) {
    case 'weekly':
      result.setDate(result.getDate() + 7);
      break;
    case 'bi-weekly':
      result.setDate(result.getDate() + 14);
      break;
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      break;
  }

  return result;
}

/**
 * Abonelikleri real-time dinler
 */
export function subscribeToSubscriptions(
  callback: (subscriptions: CustomerSubscription[]) => void,
  errorCallback?: (error: Error) => void
): () => void {
  const subsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
  const q = query(subsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const subscriptions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CustomerSubscription[];
      callback(subscriptions);
    },
    (error) => {
      console.error('Subscriptions listener error:', error);
      errorCallback?.(error);
    }
  );
}

// =====================
// VARSAYILAN PLANLAR
// =====================

/**
 * Varsayılan abonelik planlarını oluşturur (ilk kurulum için)
 */
export async function initializeDefaultPlans(): Promise<void> {
  const plans = await getSubscriptionPlans();
  if (plans.length > 0) return; // Zaten plan var

  const defaultPlans: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Tadım Yolculuğu',
      description: 'Her ay farklı bir köken, farklı bir hikaye. Single-origin çikolatalarla dünya turuna çıkın.',
      shortDescription: 'Aylık single-origin keşif',
      price: 450,
      originalPrice: 550,
      frequency: 'monthly',
      products: [
        { productId: 'rotating', name: 'Ayın Single-Origin Barı', quantity: 2, isRotating: true },
        { productId: 'tasting-notes', name: 'Tadım Notları Kartı', quantity: 1 },
      ],
      features: [
        'Her ay farklı köken',
        'Detaylı tadım notları',
        'Üretici hikayeleri',
        'Özel paketleme',
      ],
      isActive: true,
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: 'Gurme Seçki',
      description: 'İki haftada bir, en özel pralin ve bonbon koleksiyonlarımız kapınızda.',
      shortDescription: 'Premium pralin & bonbon',
      price: 380,
      frequency: 'bi-weekly',
      products: [
        { productId: 'praline-box', name: '12\'li Pralin Kutusu', quantity: 1 },
        { productId: 'bonbon-selection', name: 'Sezon Bonbonları', quantity: 6 },
      ],
      features: [
        'El yapımı pralinler',
        'Mevsimlik tatlar',
        'Şık hediye kutusu',
        'Taze üretim garantisi',
      ],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Klasik Favoriler',
      description: 'Haftalık taze çikolata keyfi. En sevilen ürünlerimiz düzenli olarak evinize gelsin.',
      shortDescription: 'Haftalık taze teslimat',
      price: 220,
      frequency: 'weekly',
      products: [
        { productId: 'classic-bar', name: 'Klasik Bitter Bar', quantity: 1 },
        { productId: 'milk-bar', name: 'Sütlü Çikolata Bar', quantity: 1 },
      ],
      features: [
        'Her hafta taze üretim',
        'Klasik lezzetler',
        'Ekonomik seçenek',
        'Esnek iptal',
      ],
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const plan of defaultPlans) {
    await createSubscriptionPlan(plan);
  }

  console.log('Default subscription plans created');
}
