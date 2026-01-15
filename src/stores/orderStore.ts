import { create } from 'zustand';
import type { Order, TrackingInfo, OrderTag, RefundRecord, CancellationRecord } from '../types/order';
import {
  subscribeToOrders,
  updateOrder,
  enableOfflinePersistence
} from '../services/orderService';
import { sendOrderConfirmationEmail } from '../services/emailService';

// --- INITIAL MOCK DATA ---
const INITIAL_ORDERS: Order[] = [
  {
    id: 'SADE-10013',
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
    id: 'SADE-10014',
    customer: {
      name: 'Mehmet Kara',
      email: 'mehmet.kara@outlook.com',
      phone: '+90 532 987 6543'
    },
    items: [
      { id: '3', name: 'Özel Seçki 24\'lü', image: '🎁', price: 580, quantity: 1 }
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
  }
];

// --- ORDER STORE STATE ---
interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Initialize & Sync
  initialize: () => Promise<void>;
  setOrders: (orders: Order[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => Promise<void>;
  addTracking: (orderId: string, carrier: string, trackingNumber: string) => Promise<void>;
  addTag: (orderId: string, label: string, color: string) => Promise<void>;
  removeTag: (orderId: string, tagIndex: number) => Promise<void>;
  editOrder: (orderId: string, updates: {
    customer?: { phone: string };
    shipping?: { address: string; city: string };
    giftNote?: string;
    specialNotes?: string;
    status?: Order['status'];
    paymentConfirmedAt?: string;
    paymentConfirmedBy?: string;
  }) => Promise<void>;
  startRefund: (orderId: string, refundData: {
    reason: string;
    amount: number;
    percentage: number;
    method: 'original' | 'credit' | 'coupon';
    notes?: string;
  }) => Promise<void>;
  cancelOrder: (orderId: string, cancelData: {
    reason: string;
    notifyCustomer: boolean;
    refundPayment: boolean;
    notes?: string;
  }) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  sendEmail: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
}

// Firestore listener unsubscribe function
let unsubscribeListener: (() => void) | null = null;

// --- CREATE STORE WITH FIRESTORE ---
export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  // 🔥 Initialize Firestore connection and real-time listener
  initialize: async () => {
    if (get().isInitialized) {
      console.log('⚠️ Order store already initialized');
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Enable offline persistence
      await enableOfflinePersistence();

      // Subscribe to real-time updates
      unsubscribeListener = subscribeToOrders(
        (orders) => {
          console.log('✅ Orders updated from Firestore:', orders.length);
          set({ orders, isLoading: false, isInitialized: true });
        },
        (error) => {
          console.error('❌ Firestore listener error:', error);
          set({ error: error.message, isLoading: false });
        }
      );

      console.log('✅ Order store initialized with Firestore');
    } catch (error: any) {
      console.error('❌ Failed to initialize order store:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Helper setters
  setOrders: (orders) => set({ orders }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // 🔄 Update Order Status
  updateOrderStatus: async (orderId, newStatus) => {
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      const updatedOrder: Partial<Order> = {
        status: newStatus,
        timeline: [
          ...(order.timeline || []),
          {
            action: `Durum güncellendi: ${newStatus}`,
            time: new Date().toLocaleString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        ]
      };

      const docId = order.firestoreId || orderId;
      await updateOrder(docId, updatedOrder);
      // Real-time listener will update the store automatically
    } catch (error: any) {
      console.error('❌ Error updating order status:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 📦 Add Tracking Number
  addTracking: async (orderId, carrier, trackingNumber) => {
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      const updatedOrder: Partial<Order> = {
        tracking: {
          carrier,
          trackingNumber,
          addedAt: new Date().toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        status: 'Shipped',
        timeline: [
          ...(order.timeline || []),
          {
            action: `Takip numarası eklendi: ${trackingNumber}`,
            time: new Date().toLocaleString('tr-TR'),
            note: `Kargo: ${carrier}`
          }
        ]
      };

      const docId = order.firestoreId || orderId;
      await updateOrder(docId, updatedOrder);
    } catch (error: any) {
      console.error('❌ Error adding tracking:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 🏷️ Add Tag
  addTag: async (orderId, label, color) => {
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      const updatedOrder: Partial<Order> = {
        tags: [
          ...(order.tags || []),
          {
            label,
            color,
            addedAt: new Date().toLocaleString('tr-TR')
          }
        ],
        timeline: [
          ...(order.timeline || []),
          {
            action: `Etiket eklendi: ${label}`,
            time: new Date().toLocaleString('tr-TR')
          }
        ]
      };

      const docId = order.firestoreId || orderId;
      await updateOrder(docId, updatedOrder);
    } catch (error: any) {
      console.error('❌ Error adding tag:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 🗑️ Remove Tag
  removeTag: async (orderId, tagIndex) => {
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);
    if (!order || !order.tags) {
      throw new Error(`Order ${orderId} not found or has no tags`);
    }

    try {
      const removedTag = order.tags[tagIndex];
      const newTags = order.tags.filter((_, idx) => idx !== tagIndex);

      const updatedOrder: Partial<Order> = {
        tags: newTags.length > 0 ? newTags : undefined,
        timeline: [
          ...(order.timeline || []),
          {
            action: `Etiket kaldırıldı: ${removedTag.label}`,
            time: new Date().toLocaleString('tr-TR')
          }
        ]
      };

      const docId = order.firestoreId || orderId;
      await updateOrder(docId, updatedOrder);
    } catch (error: any) {
      console.error('❌ Error removing tag:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // ✏️ Edit Order
  editOrder: async (orderId, updates) => {
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      const editHistory = order.editHistory || [];
      const newEdits = [];

      let updatedOrderData: Partial<Order> = {};

      // Track and update customer if provided
      if (updates.customer) {
        if (updates.customer.phone !== order.customer.phone) {
          newEdits.push({
            field: 'customer.phone',
            oldValue: order.customer.phone,
            newValue: updates.customer.phone,
            editedAt: new Date().toLocaleString('tr-TR')
          });
        }
        updatedOrderData.customer = updates.customer;
      }

      // Track and update shipping if provided
      if (updates.shipping) {
        if (updates.shipping.address !== order.shipping.address) {
          newEdits.push({
            field: 'shipping.address',
            oldValue: order.shipping.address,
            newValue: updates.shipping.address,
            editedAt: new Date().toLocaleString('tr-TR')
          });
        }
        if (updates.shipping.city !== order.shipping.city) {
          newEdits.push({
            field: 'shipping.city',
            oldValue: order.shipping.city,
            newValue: updates.shipping.city,
            editedAt: new Date().toLocaleString('tr-TR')
          });
        }
        updatedOrderData.shipping = updates.shipping;
      }

      // Track gift note changes
      if (updates.giftNote !== undefined && updates.giftNote !== order.giftNote) {
        newEdits.push({
          field: 'giftNote',
          oldValue: order.giftNote,
          newValue: updates.giftNote,
          editedAt: new Date().toLocaleString('tr-TR')
        });
        updatedOrderData.giftNote = updates.giftNote || null;
      }

      // Track special notes changes
      if (updates.specialNotes !== undefined && updates.specialNotes !== order.specialNotes) {
        newEdits.push({
          field: 'specialNotes',
          oldValue: order.specialNotes,
          newValue: updates.specialNotes,
          editedAt: new Date().toLocaleString('tr-TR')
        });
        updatedOrderData.specialNotes = updates.specialNotes || null;
      }

      // Track status changes (for payment confirmation)
      if (updates.status !== undefined && updates.status !== order.status) {
        newEdits.push({
          field: 'status',
          oldValue: order.status,
          newValue: updates.status,
          editedAt: new Date().toLocaleString('tr-TR')
        });
        updatedOrderData.status = updates.status;
      }

      // Track payment confirmation
      if (updates.paymentConfirmedAt !== undefined) {
        updatedOrderData.paymentConfirmedAt = updates.paymentConfirmedAt;
        updatedOrderData.paymentConfirmedBy = updates.paymentConfirmedBy;
        newEdits.push({
          field: 'paymentConfirmed',
          oldValue: null,
          newValue: updates.paymentConfirmedAt,
          editedAt: new Date().toLocaleString('tr-TR')
        });
      }

      // Only update history and timeline if there are actual changes
      if (newEdits.length > 0) {
        updatedOrderData.editHistory = [...editHistory, ...newEdits];
        updatedOrderData.timeline = [
          ...(order.timeline || []),
          {
            action: 'Sipariş bilgileri güncellendi',
            time: new Date().toLocaleString('tr-TR'),
            note: `${newEdits.length} alan değiştirildi`
          }
        ];
      }

      // Deep clean undefined values from nested objects
      const cleanNestedObject = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(cleanNestedObject);

        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = cleanNestedObject(value);
          }
        }
        return cleaned;
      };

      const cleanedUpdates = cleanNestedObject(updatedOrderData);

      const docId = order.firestoreId || orderId;
      await updateOrder(docId, cleanedUpdates);
    } catch (error: any) {
      console.error('❌ Error editing order:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 💰 Start Refund
  startRefund: async (orderId, refundData) => {
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      const updatedOrder: Partial<Order> = {
        refunds: [
          ...(order.refunds || []),
          {
            id: `REF-${Date.now()}`,
            ...refundData,
            createdAt: new Date().toLocaleString('tr-TR'),
            status: 'pending'
          }
        ],
        status: refundData.percentage === 100 ? 'Refunded' : order.status,
        timeline: [
          ...(order.timeline || []),
          {
            action: `İade başlatıldı: ₺${refundData.amount.toLocaleString('tr-TR')}`,
            time: new Date().toLocaleString('tr-TR'),
            note: refundData.reason
          }
        ]
      };

      const docId = order.firestoreId || orderId;
      await updateOrder(docId, updatedOrder);
    } catch (error: any) {
      console.error('❌ Error starting refund:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // ❌ Cancel Order
  cancelOrder: async (orderId, cancelData) => {
    // Hem id hem firestoreId ile ara
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      const updatedOrder: Partial<Order> = {
        cancellation: {
          ...cancelData,
          cancelledAt: new Date().toLocaleString('tr-TR')
        },
        status: 'Cancelled',
        timeline: [
          ...(order.timeline || []),
          {
            action: 'Sipariş iptal edildi',
            time: new Date().toLocaleString('tr-TR'),
            note: cancelData.reason
          }
        ]
      };

      // Firestore'da güncelle - firestoreId varsa onu kullan
      const docId = order.firestoreId || orderId;
      await updateOrder(docId, updatedOrder);

      // 📧 Müşteriye iptal emaili gönder
      if (cancelData.notifyCustomer && order.customer?.email) {
        try {
          const { sendOrderCancellationEmail } = await import('../services/emailService');
          await sendOrderCancellationEmail(order, cancelData.reason);
        } catch (emailError) {
          console.error('❌ Failed to send cancellation email:', emailError);
        }
      }
    } catch (error: any) {
      console.error('❌ Error cancelling order:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 🗑️ Delete Order (Firestore'dan tamamen sil)
  deleteOrder: async (orderId) => {
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      const { deleteOrder: deleteOrderFromFirestore } = await import('../services/orderService');
      const docId = order.firestoreId || orderId;
      await deleteOrderFromFirestore(docId);

      // Local state'den de kaldır
      set(state => ({
        orders: state.orders.filter(o => o.id !== order.id && o.firestoreId !== order.firestoreId)
      }));
    } catch (error: any) {
      console.error('❌ Error deleting order:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 📧 Send Email
  sendEmail: async (orderId) => {
    const order = get().orders.find(o => o.id === orderId || o.firestoreId === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Email adresi kontrolü
    const customerEmail = order.customer?.email;
    if (!customerEmail) {
      throw new Error('Müşteri email adresi bulunamadı');
    }

    try {
      // Gerçek email gönder
      await sendOrderConfirmationEmail(customerEmail, {
        orderId: order.orderNumber || order.id,
        customerName: order.customer?.name || 'Değerli Müşterimiz',
        items: (order.items || []).map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price * item.quantity
        })),
        subtotal: order.payment?.subtotal || order.payment?.total || 0,
        shipping: order.payment?.shipping || 0,
        total: order.payment?.total || 0,
        address: order.shipping?.address
          ? `${order.shipping.address}, ${order.shipping.city || ''}`
          : 'Adres belirtilmemiş'
      });

      // Timeline güncelle
      const updatedOrder: Partial<Order> = {
        timeline: [
          ...(order.timeline || []),
          {
            action: 'Sipariş onay e-postası gönderildi',
            time: new Date().toLocaleString('tr-TR'),
            note: customerEmail
          }
        ]
      };

      const docId = order.firestoreId || orderId;
      await updateOrder(docId, updatedOrder);

      console.log('✅ Sipariş onay emaili gönderildi:', customerEmail);
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 🔍 Get Order By ID
  getOrderById: (orderId) => {
    return get().orders.find((order) => order.id === orderId);
  }
}));
