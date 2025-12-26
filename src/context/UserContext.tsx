import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

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
  status: string;
  total: number;
  items: any[];
}

interface UserContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  loading: boolean;
  orders: Order[];
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  register: (profile: Omit<UserProfile, 'uid'>, pass: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addOrder: (order: Order) => Promise<void>; // ✅ Yeni eklendi
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Varsayılan true
  const [orders, setOrders] = useState<Order[]>([]);

  // ✅ CANLI TAKİP: Firebase Auth ve Firestore Senkronizasyonu
useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeDoc) unsubscribeDoc(); // Önceki dinleyiciyi temizle

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
    // Beni hatırla seçiliyse LOCAL (kalıcı), değilse SESSION (sekme kapanınca silinir)
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(auth, email, pass);
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
const addOrder = async (order: Order) => {
    if (!user?.uid) return;
    const userRef = doc(db, 'users', user.uid);
    const updatedOrders = [order, ...orders];
    await updateDoc(userRef, { orders: updatedOrders });
    // onSnapshot otomatik olarak setOrders(updatedOrders) yapacaktır.
  };
  return (
    <UserContext.Provider value={{
      user, isLoggedIn: !!user, loading, orders,
      login, register, logout, updateProfile, addOrder // ✅ addOrder eklendi
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