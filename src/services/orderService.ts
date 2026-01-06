import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types/order';
import {
  getOrCreateCustomer,
  addPointsForPurchase,
  checkTierUpgrade,
  applyReferralBonus,
  getLoyaltyConfig
} from './loyaltyService';

// Firestore collection reference
const ordersCollection = collection(db, 'orders');

// 🔥 OFFLINE PERSISTENCE
// Not: Offline persistence artık Firebase initialization'da (firebase.ts) yapılandırılıyor
// enableIndexedDbPersistence() deprecated oldu, yerine initializeFirestore kullanılıyor
export const enableOfflinePersistence = async () => {
  console.log('✅ Firestore offline persistence is configured at initialization');
};

// SLA hesaplama yardımcı fonksiyonu
const calculateSLA = (createdAt: any): number => {
  try {
    let createdDate: Date;

    if (createdAt?.toDate) {
      // Firestore Timestamp
      createdDate = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      createdDate = createdAt;
    } else if (typeof createdAt === 'string') {
      // String format: "2025-01-15 09:30" veya ISO string
      createdDate = new Date(createdAt);
    } else {
      return 0;
    }

    if (isNaN(createdDate.getTime())) return 0;

    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    return Math.max(0, diffMinutes);
  } catch {
    return 0;
  }
};

// 📥 FETCH ALL ORDERS
export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const q = query(ordersCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        // SLA hesapla (siparişten bu yana geçen dakika)
        sla: calculateSLA(data.createdAt),
        // Timestamp'leri string'e çevir
        createdAt: data.createdAt?.toDate?.()?.toLocaleString('tr-TR') || data.createdAt,
        tracking: data.tracking ? {
          ...data.tracking,
          addedAt: data.tracking.addedAt?.toDate?.()?.toLocaleString('tr-TR') || data.tracking.addedAt
        } : undefined,
        tags: data.tags?.map((tag: any) => ({
          ...tag,
          addedAt: tag.addedAt?.toDate?.()?.toLocaleString('tr-TR') || tag.addedAt
        })),
        timeline: data.timeline?.map((entry: any) => ({
          ...entry,
          time: entry.time?.toDate?.()?.toLocaleString('tr-TR') || entry.time
        }))
      } as Order;
    });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    throw error;
  }
};

// 👂 REAL-TIME LISTENER
// Yeni sipariş geldiğinde veya sipariş güncellendiğinde otomatik güncelleme
export const subscribeToOrders = (
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(ordersCollection, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // SLA hesapla (siparişten bu yana geçen dakika)
          sla: calculateSLA(data.createdAt),
          createdAt: data.createdAt?.toDate?.()?.toLocaleString('tr-TR') || data.createdAt,
          tracking: data.tracking ? {
            ...data.tracking,
            addedAt: data.tracking.addedAt?.toDate?.()?.toLocaleString('tr-TR') || data.tracking.addedAt
          } : undefined,
          tags: data.tags?.map((tag: any) => ({
            ...tag,
            addedAt: tag.addedAt?.toDate?.()?.toLocaleString('tr-TR') || tag.addedAt
          })),
          timeline: data.timeline?.map((entry: any) => ({
            ...entry,
            time: entry.time?.toDate?.()?.toLocaleString('tr-TR') || entry.time
          }))
        } as Order;
      });

      onUpdate(orders);
    },
    (error) => {
      console.error('❌ Error in orders listener:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// 📝 CREATE ORDER
export const createOrder = async (orderData: Omit<Order, 'id'>): Promise<string> => {
  try {
    // String tarihleri Timestamp'e çevir
    const firestoreData: any = {
      ...orderData,
      createdAt: serverTimestamp(),
      tags: orderData.tags?.map(tag => ({
        ...tag,
        addedAt: Timestamp.now()
      })) || [],
      timeline: orderData.timeline?.map(entry => ({
        ...entry,
        time: Timestamp.now()
      })) || []
    };

    // Only add tracking if it exists
    if (orderData.tracking) {
      firestoreData.tracking = {
        ...orderData.tracking,
        addedAt: Timestamp.now()
      };
    }

    // 🚫 Clean undefined values - Firestore doesn't accept undefined
    const cleanedData = Object.fromEntries(
      Object.entries(firestoreData).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(ordersCollection, cleanedData);
    console.log('✅ Order created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
};

// 🔄 UPDATE ORDER
export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);

    // String tarihleri Timestamp'e çevir
    const firestoreUpdates = {
      ...updates,
      tracking: updates.tracking ? {
        ...updates.tracking,
        addedAt: Timestamp.now()
      } : undefined,
      tags: updates.tags?.map(tag => ({
        ...tag,
        addedAt: typeof tag.addedAt === 'string' ? Timestamp.now() : tag.addedAt
      })),
      timeline: updates.timeline?.map(entry => ({
        ...entry,
        time: typeof entry.time === 'string' ? Timestamp.now() : entry.time
      }))
    };

    // 🚫 Firestore undefined kabul etmiyor - undefined field'ları temizle
    const cleanedUpdates = Object.fromEntries(
      Object.entries(firestoreUpdates).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(orderRef, cleanedUpdates);
    console.log('✅ Order updated:', orderId);
  } catch (error) {
    console.error('❌ Error updating order:', error);
    throw error;
  }
};

// 🗑️ DELETE ORDER
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
    console.log('✅ Order deleted:', orderId);
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    throw error;
  }
};

// 🔍 GET SINGLE ORDER
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return null;
    }

    const data = orderDoc.data();
    return {
      ...data,
      id: orderDoc.id,
      createdAt: data.createdAt?.toDate?.()?.toLocaleString('tr-TR') || data.createdAt,
      tracking: data.tracking ? {
        ...data.tracking,
        addedAt: data.tracking.addedAt?.toDate?.()?.toLocaleString('tr-TR') || data.tracking.addedAt
      } : undefined,
      tags: data.tags?.map((tag: any) => ({
        ...tag,
        addedAt: tag.addedAt?.toDate?.()?.toLocaleString('tr-TR') || tag.addedAt
      })),
      timeline: data.timeline?.map((entry: any) => ({
        ...entry,
        time: entry.time?.toDate?.()?.toLocaleString('tr-TR') || entry.time
      }))
    } as Order;
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    throw error;
  }
};

// 🔎 FILTER ORDERS BY STATUS
export const getOrdersByStatus = async (status: Order['status']): Promise<Order[]> => {
  try {
    const q = query(
      ordersCollection,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toLocaleString('tr-TR') || data.createdAt
      } as Order;
    });
  } catch (error) {
    console.error('❌ Error fetching orders by status:', error);
    throw error;
  }
};

// 📊 BATCH IMPORT (İlk veriler için)
export const batchImportOrders = async (orders: Omit<Order, 'id'>[]): Promise<void> => {
  try {
    const promises = orders.map(order => createOrder(order));
    await Promise.all(promises);
    console.log(`✅ Batch imported ${orders.length} orders`);
  } catch (error) {
    console.error('❌ Error batch importing orders:', error);
    throw error;
  }
};

// 🎁 CREATE ORDER WITH LOYALTY INTEGRATION
export const createOrderWithLoyalty = async (
  orderData: Omit<Order, 'id'>,
  customerEmail: string
): Promise<string> => {
  try {
    // Check if loyalty system is active
    const config = await getLoyaltyConfig();
    if (!config || !config.isActive) {
      console.log('⚠️ Loyalty system is not active, creating order without loyalty');
      return await createOrder(orderData);
    }

    // 1. Get or create customer profile
    const customer = await getOrCreateCustomer(
      customerEmail,
      orderData.customer.name,
      undefined // uid - can be added if user is authenticated
    );

    console.log(`📊 Customer: ${customer.email} (${customer.tierLevel})`);

    // 2. Create order with customer reference and tier info
    const enrichedOrderData: Omit<Order, 'id'> = {
      ...orderData,
      customerId: customer.id,
      customerTier: customer.tierLevel,
      loyaltyPointsEarned: 0 // Will be updated below
    };

    const orderId = await createOrder(enrichedOrderData);
    console.log(`✅ Order created: ${orderId}`);

    // 3. Award loyalty points for purchase
    const pointsEarned = await addPointsForPurchase(
      customer.id,
      orderId,
      orderData.payment.total,
      customer.tierLevel
    );

    console.log(`⭐ Awarded ${pointsEarned} points to ${customer.email}`);

    // 4. Update order with points earned
    await updateOrder(orderId, { loyaltyPointsEarned: pointsEarned });

    // 5. Check for tier upgrade
    const tierUpgrade = await checkTierUpgrade(customer.id);
    if (tierUpgrade.upgraded) {
      console.log(`🎉 Customer ${customerEmail} upgraded: ${tierUpgrade.oldTier} → ${tierUpgrade.newTier}!`);
      // TODO: Send tier upgrade email notification
    }

    // 6. Apply referral bonus if this is first order
    if (customer.totalOrders === 0 && customer.referredBy) {
      console.log(`🎁 Applying referral bonus for ${customer.email}`);
      try {
        await applyReferralBonus(customer.referredBy, customer.id);
      } catch (error) {
        console.error('❌ Error applying referral bonus:', error);
        // Don't fail the order if referral bonus fails
      }
    }

    // 7. Update customer stats
    await updateOrder(orderId, {
      customerId: customer.id,
      customerTier: tierUpgrade.upgraded ? tierUpgrade.newTier : customer.tierLevel
    });

    return orderId;
  } catch (error) {
    console.error('❌ Error creating order with loyalty:', error);
    // Fallback to regular order creation
    console.log('⚠️ Falling back to regular order creation');
    return await createOrder(orderData);
  }
};
