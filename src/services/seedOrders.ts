import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types/order';

/**
 * Mock siparişleri Firestore'a yükler
 */
export async function seedMockOrders(): Promise<number> {
  const ordersRef = collection(db, 'orders');

  const mockOrders: Omit<Order, 'id'>[] = [
    {
      customer: {
        name: 'Aylin Yılmaz',
        email: 'aylin.yilmaz@gmail.com',
        phone: '+90 555 123 4567'
      },
      items: [
        { id: '1', name: 'Bitter Ganache 12\'li', image: '🍫', price: 320, quantity: 2 },
        { id: '2', name: 'Truffle Koleksiyonu', image: '🎁', price: 180, quantity: 1 }
      ],
      status: 'Awaiting Prep',
      priority: 'High',
      tempAlert: true,
      gift: true,
      giftNote: 'Doğum günün kutlu olsun canım!',
      sla: 14,
      createdAt: '2025-01-15 09:30',
      shipping: {
        method: 'Express Kargo',
        address: 'Bağdat Cad. No: 143 Daire: 8',
        city: 'İstanbul / Kadıköy',
        estimatedDate: '17 Ocak 2025'
      },
      billing: {
        address: 'Bağdat Cad. No: 143 Daire: 8',
        city: 'İstanbul / Kadıköy'
      },
      payment: {
        subtotal: 820,
        shipping: 0,
        tax: 0,
        discount: 0,
        total: 820
      },
      timeline: [
        { action: 'Sipariş oluşturuldu', time: '2025-01-15 09:30' },
        { action: 'Ödeme onaylandı', time: '2025-01-15 09:31', note: 'Kredi Kartı' }
      ],
      logistics: {
        lotNumber: 'LOT-2025-W03-045',
        coldPackage: true,
        shippingWindow: 'Pazartesi-Çarşamba',
        weatherAlert: 'Hafta sonu 22°C tahmin ediliyor - Soğuk paket eklenecek'
      }
    },
    {
      customer: {
        name: 'Mehmet Kara',
        email: 'mehmet.kara@outlook.com',
        phone: '+90 532 987 6543'
      },
      items: [
        { id: '3', name: 'Özel Seçki 24\'li', image: '🎁', price: 580, quantity: 1 }
      ],
      status: 'In Production',
      priority: 'Normal',
      tempAlert: false,
      gift: false,
      giftNote: null,
      sla: 18,
      createdAt: '2025-01-14 14:20',
      shipping: {
        method: 'Standart Kargo',
        address: 'Tunalı Hilmi Cad. No: 87/4',
        city: 'Ankara / Çankaya',
        estimatedDate: '19 Ocak 2025'
      },
      billing: {
        address: 'Tunalı Hilmi Cad. No: 87/4',
        city: 'Ankara / Çankaya'
      },
      payment: {
        subtotal: 580,
        shipping: 25,
        tax: 0,
        discount: -50,
        total: 555
      },
      timeline: [
        { action: 'Sipariş oluşturuldu', time: '2025-01-14 14:20' },
        { action: 'Ödeme onaylandı', time: '2025-01-14 14:22', note: 'Havale/EFT' },
        { action: 'Üretime alındı', time: '2025-01-15 08:00' }
      ],
      logistics: {
        lotNumber: 'LOT-2025-W02-132',
        coldPackage: false,
        shippingWindow: 'Pazartesi-Cuma'
      }
    },
    {
      customer: {
        name: 'Zeynep Demir',
        email: 'zeynep.demir@example.com',
        phone: '+90 545 678 9012'
      },
      items: [
        { id: '4', name: 'Sütlü Çikolata Klasik 6\'lı', image: '🍫', price: 150, quantity: 3 },
        { id: '5', name: 'Beyaz Çikolata Özel 12\'li', image: '🎁', price: 280, quantity: 1 }
      ],
      status: 'Shipped',
      priority: 'Normal',
      tempAlert: false,
      gift: true,
      giftNote: 'Sevgilerimle...',
      sla: 8,
      createdAt: '2025-01-12 11:45',
      shipping: {
        method: 'Express Kargo',
        address: 'Nispetiye Cad. No: 52/7',
        city: 'İstanbul / Beşiktaş',
        estimatedDate: '14 Ocak 2025'
      },
      billing: {
        address: 'Nispetiye Cad. No: 52/7',
        city: 'İstanbul / Beşiktaş'
      },
      payment: {
        subtotal: 730,
        shipping: 0,
        tax: 0,
        discount: -30,
        total: 700
      },
      timeline: [
        { action: 'Sipariş oluşturuldu', time: '2025-01-12 11:45' },
        { action: 'Ödeme onaylandı', time: '2025-01-12 11:46', note: 'Kredi Kartı' },
        { action: 'Üretime alındı', time: '2025-01-12 16:00' },
        { action: 'Kargoya verildi', time: '2025-01-13 10:30' },
        { action: 'Takip numarası eklendi: 1234567890', time: '2025-01-13 10:31', note: 'Kargo: Aras Kargo' }
      ],
      tracking: {
        carrier: 'Aras Kargo',
        trackingNumber: '1234567890',
        addedAt: '2025-01-13 10:31'
      },
      logistics: {
        lotNumber: 'LOT-2025-W01-087',
        coldPackage: true,
        shippingWindow: 'Pazartesi-Cuma'
      },
      tags: [
        { label: 'Öncelikli', color: 'red', addedAt: '2025-01-12 11:50' },
        { label: 'VIP Müşteri', color: 'purple', addedAt: '2025-01-12 11:50' }
      ]
    }
  ];

  let added = 0;

  for (const order of mockOrders) {
    try {
      // Firestore formatına çevir
      const firestoreOrder = {
        ...order,
        createdAt: Timestamp.now(),
        timeline: order.timeline?.map(entry => ({
          ...entry,
          time: Timestamp.now()
        })),
        tracking: order.tracking ? {
          ...order.tracking,
          addedAt: Timestamp.now()
        } : undefined,
        tags: order.tags?.map(tag => ({
          ...tag,
          addedAt: Timestamp.now()
        }))
      };

      // undefined değerleri temizle
      const cleanedOrder = Object.fromEntries(
        Object.entries(firestoreOrder).filter(([_, value]) => value !== undefined)
      );

      await addDoc(ordersRef, cleanedOrder);
      added++;
      console.log(`✅ Mock sipariş eklendi: ${order.customer.name}`);
    } catch (error) {
      console.error(`❌ Sipariş eklenemedi:`, error);
    }
  }

  return added;
}
