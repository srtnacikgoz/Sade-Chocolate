import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Firestore'daki geçersiz/boş siparişleri temizler
 *
 * Şu kriterlere uyan siparişler silinir:
 * - customer veya customer.name boş/undefined
 * - items boş veya undefined
 * - payment veya payment.total boş/undefined/0
 */
export async function cleanupInvalidOrders(): Promise<{
  total: number;
  deleted: number;
  errors: number;
}> {
  const ordersRef = collection(db, 'orders');
  const snapshot = await getDocs(ordersRef);

  let total = snapshot.size;
  let deleted = 0;
  let errors = 0;

  console.log(`🔍 ${total} sipariş taranıyor...`);

  for (const orderDoc of snapshot.docs) {
    const order = orderDoc.data();
    const orderId = orderDoc.id;

    // Geçersiz sipariş kontrolleri
    const isInvalid =
      !order.customer ||
      !order.customer.name ||
      !order.items ||
      order.items.length === 0 ||
      !order.payment ||
      !order.payment.total ||
      order.payment.total === 0;

    if (isInvalid) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        deleted++;
        console.log(`✅ Silindi: ${orderId}`);
      } catch (error) {
        errors++;
        console.error(`❌ Silinemedi: ${orderId}`, error);
      }
    }
  }

  console.log(`
🎯 Temizlik Raporu:
   Toplam: ${total}
   Silinen: ${deleted}
   Hata: ${errors}
   Kalan: ${total - deleted}
  `);

  return { total, deleted, errors };
}

/**
 * Sadece belirli bir kritere uyan siparişleri siler
 */
export async function deleteOrdersByCondition(
  condition: (order: any) => boolean
): Promise<number> {
  const ordersRef = collection(db, 'orders');
  const snapshot = await getDocs(ordersRef);

  let deleted = 0;

  for (const orderDoc of snapshot.docs) {
    const order = orderDoc.data();

    if (condition(order)) {
      try {
        await deleteDoc(doc(db, 'orders', orderDoc.id));
        deleted++;
      } catch (error) {
        console.error(`Failed to delete ${orderDoc.id}:`, error);
      }
    }
  }

  return deleted;
}
