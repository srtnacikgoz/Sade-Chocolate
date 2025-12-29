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

// Firestore collection reference
const ordersCollection = collection(db, 'orders');

// 🔥 OFFLINE PERSISTENCE
// Not: Offline persistence artık Firebase initialization'da (firebase.ts) yapılandırılıyor
// enableIndexedDbPersistence() deprecated oldu, yerine initializeFirestore kullanılıyor
export const enableOfflinePersistence = async () => {
  console.log('✅ Firestore offline persistence is configured at initialization');
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
    const firestoreData = {
      ...orderData,
      createdAt: serverTimestamp(),
      tracking: orderData.tracking ? {
        ...orderData.tracking,
        addedAt: Timestamp.now()
      } : undefined,
      tags: orderData.tags?.map(tag => ({
        ...tag,
        addedAt: Timestamp.now()
      })),
      timeline: orderData.timeline?.map(entry => ({
        ...entry,
        time: Timestamp.now()
      }))
    };

    const docRef = await addDoc(ordersCollection, firestoreData);
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

    await updateDoc(orderRef, firestoreUpdates);
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
