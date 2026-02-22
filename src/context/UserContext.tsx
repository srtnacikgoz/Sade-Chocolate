import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db, functions } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot, updateDoc, collection, serverTimestamp, runTransaction, setDoc, query, where, orderBy } from 'firebase/firestore';
import { createOrderWithLoyalty } from '../services/orderService';
import { deleteAccount as deleteAccountService } from '../services/accountService';
import type { Order as LoyaltyOrder } from '../types/order';

export interface UserAddress {
  id: number;
  title: string;
  address: string;
  city: string;
  isDefault: boolean;
}

export interface InvoiceProfile {
    id: number;
    title: string;
    type: 'individual' | 'corporate';
    firstName?: string;
    lastName?: string;
    tckn?: string;
    companyName?: string;
    taxOffice?: string;
    taxNo?: string;
    city: string;
    address: string;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  addresses?: any[];
  invoiceProfiles?: any[]; // ✅ Yeni eklendi
  role?: string;
  displayName?: string;
}

export interface Order {
  id: string;              // Firestore document ID
  orderNumber: string;     // User-friendly order number (SADE-XXXXXX)
  date: string;
  status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'processing';
  total: number;
  subtotal?: number;
  shippingCost?: number;
  items: any[];
  userId?: string;
  customerName?: string;
  createdAt?: any;

  // Teslimat Bilgileri
  shipping?: {
    address: string;
    city: string;
    district?: string;
    method?: string;
    trackingNumber?: string;
    carrier?: string;
  };

  // Kargo Takip Bilgileri
  tracking?: {
    carrier: string;
    trackingNumber: string;
    barcode?: string;
    estimatedDelivery?: string;
    referenceId?: string;
  };

  // Fatura Bilgileri
  invoice?: {
    type: 'individual' | 'corporate';
    name?: string;
    taxOffice?: string;
    taxNo?: string;
    address?: string;
    city?: string;
  };

  // Ödeme Bilgileri
  payment?: {
    method: 'card' | 'eft';
    status: 'pending' | 'paid' | 'failed';
    cardInfo?: string;  // **** 1234
  };

  // ✨ Lüks Operasyon Alanları
  giftDetails?: {
    isGift: boolean;
    note: string;
    fontFamily: string;
    recipientName: string;
  };
  weatherAlert?: {
    temp: number;
    requiresIce: boolean;
  };
}

interface UserContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  loading: boolean;
  orders: Order[];
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  register: (profile: Omit<UserProfile, 'uid'>, pass: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'date'>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;
    let unsubscribeOrders: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeDoc) unsubscribeDoc();
      if (unsubscribeOrders) unsubscribeOrders();

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Firestore + Firebase Auth verilerini birleştir (Firestore öncelikli, eksikse Auth'dan al)
            setUser({
              uid: firebaseUser.uid,
              ...data,
              // Firestore'da yoksa Firebase Auth'dan al
              email: data.email || firebaseUser.email || '',
              firstName: data.firstName || firebaseUser.displayName?.split(' ')[0] || '',
              lastName: data.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              phone: data.phone || firebaseUser.phoneNumber || ''
            } as UserProfile);
          } else {
            // Firestore belgesi yoksa Firebase Auth'dan oluştur
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              phone: firebaseUser.phoneNumber || ''
            } as any);
          }
          setLoading(false);
        });

        // Siparişleri orders collection'ından dinle (customer.email ile eşleştir)
        const userEmail = firebaseUser.email;
        if (userEmail) {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('customer.email', '==', userEmail)
          );
          unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            const userOrders: Order[] = snapshot.docs.map(doc => {
              const data = doc.data();

              // Firestore Timestamp'i string'e çevir
              let dateString = new Date().toISOString();
              if (data.createdAt) {
                if (typeof data.createdAt === 'string') {
                  dateString = data.createdAt;
                } else if (data.createdAt.toDate) {
                  // Firestore Timestamp
                  dateString = data.createdAt.toDate().toISOString();
                } else if (data.createdAt.seconds) {
                  // Raw timestamp object
                  dateString = new Date(data.createdAt.seconds * 1000).toISOString();
                }
              }

              return {
                id: doc.id,
                orderNumber: data.id || `SADE-${doc.id.substring(0, 6).toUpperCase()}`, // User-friendly order number
                date: dateString,
                status: data.status || 'pending',
                total: data.payment?.total || 0,
                subtotal: data.payment?.subtotal || 0,
                shippingCost: data.payment?.shipping || 0,
                items: data.items || [],
                customerName: data.customer?.name || '',
                userId: data.userId,
                // Teslimat Bilgileri
                shipping: data.shipping ? {
                  address: data.shipping.address || '',
                  city: data.shipping.city || '',
                  district: data.shipping.district || '',
                  method: data.shipping.method || 'standard',
                  trackingNumber: data.shipping.trackingNumber || data.tracking?.trackingNumber,
                  carrier: data.shipping.carrier || data.tracking?.carrier
                } : undefined,
                // Kargo Takip Bilgileri
                tracking: data.tracking ? {
                  carrier: data.tracking.carrier || 'MNG Kargo',
                  trackingNumber: data.tracking.trackingNumber || '',
                  barcode: data.tracking.barcode,
                  estimatedDelivery: data.tracking.estimatedDelivery,
                  referenceId: data.tracking.referenceId
                } : undefined,
                // Fatura Bilgileri
                invoice: data.invoice ? {
                  type: data.invoice.type || 'individual',
                  name: data.invoice.name || data.invoice.companyName || '',
                  taxOffice: data.invoice.taxOffice || '',
                  taxNo: data.invoice.taxNo || '',
                  address: data.invoice.address || '',
                  city: data.invoice.city || ''
                } : { type: 'individual' as const },
                // Ödeme Bilgileri
                payment: {
                  method: data.payment?.method || 'card',
                  status: data.payment?.status || 'pending',
                  cardInfo: data.payment?.lastFourDigits ? `**** ${data.payment.lastFourDigits}` : undefined
                }
              } as Order;
            });
            // Tarihe göre sırala (en yeni en üstte)
            userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setOrders(userOrders);
          });
        }
      } else {
        setUser(null);
        setOrders([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  const login = async (email: string, pass: string, rememberMe: boolean = true) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, provider);

    // Google'dan gelen kullanıcı bilgilerini Firestore'a kaydet
    const firebaseUser = result.user;
    const userRef = doc(db, 'users', firebaseUser.uid);

    // Kullanıcı ilk kez giriş yapıyorsa profil oluştur
    await setDoc(userRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      firstName: firebaseUser.displayName?.split(' ')[0] || '',
      lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
      phone: firebaseUser.phoneNumber || '',
      birthDate: '',
      createdAt: serverTimestamp(),
      addresses: [],
      invoiceProfiles: []
    }, { merge: true }); // merge: true ile mevcut veriyi korur
  };

  const resetPassword = async (email: string) => {
    // Custom Firebase Function kullanarak SendGrid ile email gönder
    const sendCustomPasswordResetEmail = httpsCallable(functions, 'sendCustomPasswordResetEmail');
    await sendCustomPasswordResetEmail({ email });
  };

  const register = (profile: Omit<UserProfile, 'uid'>, pass: string) => {
    // Kayıt işlemi Register.tsx içinde halledildiği için burada sadece state güncellenir
    // onSnapshot otomatik olarak yakalayacaktır.
  };

  const logout = () => {
    signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user?.uid) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, data);
  };

  const addOrder = async (order: Omit<Order, 'id' | 'date'>) => {
    if (!user?.uid || !user.firstName || !user.lastName || !user.email) {
        console.error("Sipariş oluşturmak için kullanıcı bilgileri eksik.");
        return;
    }

    try {
        // Convert checkout order to full Order format for loyalty system
        const customerAddress = user.addresses?.find((a: any) => a.isDefault) || user.addresses?.[0];

        // Ödeme yöntemi kontrolü - paymentMethod field'ını kullan
        const isEftPayment = (order as any).paymentMethod === 'eft' || order.status === 'Ödeme Bekleniyor';

        // Telefon: Önce kullanıcı profilinden, yoksa adresten al
        const customerPhone = user.phone || customerAddress?.phone || '';

        const fullOrderData: Omit<LoyaltyOrder, 'id'> = {
            orderNumber: order.id, // SADE-XXXXXX formatı
            customer: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: customerPhone,
                address: customerAddress?.address || customerAddress?.street || ''
            },
            // CAPI deduplication verileri (order objesinden aktar)
            ...((order as any).pixelEventId && { pixelEventId: (order as any).pixelEventId }),
            ...((order as any).fbc !== undefined && { fbc: (order as any).fbc }),
            ...((order as any).fbp !== undefined && { fbp: (order as any).fbp }),
            ...((order as any).userAgent && { userAgent: (order as any).userAgent }),
            ...((order as any).sourceUrl && { sourceUrl: (order as any).sourceUrl }),
            items: order.items.map((item: any) => ({
                productId: item.id || item.productId || '',
                name: item.name || item.title || '',
                quantity: item.quantity || 1,
                price: item.price || 0,
                image: item.image || ''
            })),
            payment: {
                method: isEftPayment ? 'eft' : 'card',
                subtotal: order.subtotal || order.total,
                shipping: order.shippingCost || 0,
                tax: 0,
                total: order.total,
                status: isEftPayment ? 'pending' : 'paid'
            },
            shipping: {
                address: customerAddress?.address || customerAddress?.street || '',
                city: customerAddress?.city || '',
                district: customerAddress?.district || '',
                phone: customerPhone, // Telegram bildirimi için
                method: 'standard',
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            status: isEftPayment ? 'pending' : 'processing',
            createdAt: new Date().toLocaleString('tr-TR'),
            tags: [],
            timeline: [
                {
                    status: isEftPayment ? 'pending' : 'processing',
                    time: new Date().toLocaleString('tr-TR'),
                    note: isEftPayment ? 'Ödeme bekleniyor' : 'Sipariş alındı'
                }
            ]
        };

        // Create order with loyalty integration
        console.log('🎁 Creating order with loyalty for:', user.email);
        const orderId = await createOrderWithLoyalty(fullOrderData, user.email);

        console.log('✅ Order created with loyalty:', orderId);

        // Add to local state for UI
        const newOrder: Order = {
            ...order,
            id: orderId,
            date: new Date().toISOString(),
            userId: user.uid,
            customerName: `${user.firstName} ${user.lastName}`
        };

        setOrders(prevOrders => [newOrder, ...prevOrders]);

    } catch (error) {
        console.error("❌ Sipariş oluşturma hatası:", error);
        throw error;
    }
};

  const handleDeleteAccount = async () => {
    if (!user?.uid || !user?.email) return;
    await deleteAccountService(user.uid, user.email);
    // Auth silme accountService içinde yapılıyor, state temizle
    setUser(null);
    setOrders([]);
  };

  return (
    <UserContext.Provider value={{
      user, isLoggedIn: !!user, loading, orders,
      login, loginWithGoogle, resetPassword, register, logout, updateProfile, addOrder,
      deleteAccount: handleDeleteAccount
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};