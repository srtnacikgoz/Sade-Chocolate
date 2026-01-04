import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, onSnapshot, updateDoc, collection, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
import { createOrderWithLoyalty } from '../services/orderService';
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
  id: string;
  date: string;
  status: 'pending' | 'preparing' | 'shipped' | 'delivered'; // Statüleri netleştirdik
  total: number;
  items: any[];
  userId?: string;
  customerName?: string;
  createdAt?: any;
  
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeDoc) unsubscribeDoc();

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({ uid: firebaseUser.uid, ...data } as UserProfile);
            if (data.orders) setOrders(data.orders);
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email } as any);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setOrders([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
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
    await sendPasswordResetEmail(auth, email);
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

        const fullOrderData: Omit<LoyaltyOrder, 'id'> = {
            customer: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone || '',
                address: customerAddress?.address || ''
            },
            items: order.items.map((item: any) => ({
                productId: item.id || item.productId || '',
                name: item.name || item.title || '',
                quantity: item.quantity || 1,
                price: item.price || 0,
                image: item.image || ''
            })),
            payment: {
                method: order.status === 'pending' ? 'eft' : 'card',
                subtotal: order.total,
                shipping: 0,
                tax: 0,
                total: order.total,
                status: order.status === 'pending' ? 'pending' : 'paid'
            },
            shipping: {
                address: customerAddress?.address || '',
                city: customerAddress?.city || '',
                method: 'standard',
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            status: order.status === 'pending' ? 'pending' : 'processing',
            createdAt: new Date().toLocaleString('tr-TR'),
            tags: [],
            timeline: [
                {
                    status: order.status === 'pending' ? 'pending' : 'processing',
                    time: new Date().toLocaleString('tr-TR'),
                    note: order.status === 'pending' ? 'Ödeme bekleniyor' : 'Sipariş alındı'
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

  return (
    <UserContext.Provider value={{
      user, isLoggedIn: !!user, loading, orders,
      login, loginWithGoogle, resetPassword, register, logout, updateProfile, addOrder
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