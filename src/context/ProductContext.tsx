import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, updateDoc, doc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { toast } from 'sonner'; // Modern bildirim sistemi

interface GiftBagSettings {
  enabled: boolean;
  price: number;
  images: string[];
  description: string;
}

interface ShippingSettings {
  freeShippingLimit: number;
  defaultShippingCost: number;
  giftBag?: GiftBagSettings;
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  settings: ShippingSettings;
  updateShippingSettings: (updates: Partial<ShippingSettings>) => Promise<void>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  minPrice: number | '';
  setMinPrice: React.Dispatch<React.SetStateAction<number | ''>>;
  maxPrice: number | '';
  setMaxPrice: React.Dispatch<React.SetStateAction<number | ''>>;
  sortOrder: string;
  setSortOrder: React.Dispatch<React.SetStateAction<string>>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShippingSettings>({
    freeShippingLimit: 1500,
    defaultShippingCost: 95,
    giftBag: undefined
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<string>('default');

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
        setLoading(false);
      }, 
      (err) => {
        setError('Ürünler senkronize edilemedi.');
        toast.error('Veri bağlantı hatası!');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- OPTIMISTIC UPDATE VE GÜÇLÜ HATA YÖNETİMİ ---
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const previousProducts = [...products];
    // 1. UI'ı anında güncelle (Sürtünmesiz Akış)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    try {
      await updateDoc(doc(db, 'products', id), updates);
      toast.success('Ürün başarıyla güncellendi.');
    } catch (err) {
      // 2. Hata olursa eski veriye dön (Fail-Safe)
      setProducts(previousProducts);
      toast.error('Güncelleme başarısız! Yetkiniz olmayabilir.');
      throw err;
    }
  };
  // Firestore'dan kargo ayarlarını dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'shipping'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          freeShippingLimit: data.freeShippingLimit ?? 1500,
          defaultShippingCost: data.defaultShippingCost ?? 95,
          giftBag: data.giftBag
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const updateShippingSettings = async (updates: Partial<ShippingSettings>) => {
    try {
      await updateDoc(doc(db, 'settings', 'shipping'), updates);
      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Kargo ayarları güncellendi.');
    } catch (err) {
      toast.error('Ayarlar güncellenemedi.');
    }
  };

  const addProduct = async (data: Omit<Product, 'id'>) => {
    try {
      await addDoc(collection(db, 'products'), data);
      toast.success('Yeni artisan ürün eklendi.');
    } catch (err) {
      toast.error('Ürün eklenemedi!');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Ürün koleksiyondan kaldırıldı.');
    } catch (err) {
      toast.error('Silme işlemi başarısız!');
      throw err;
    }
  };

  return (
    <ProductContext.Provider value={{
      products, loading, error, addProduct, updateProduct, deleteProduct,
      settings, updateShippingSettings,
      selectedCategory, setSelectedCategory,
      minPrice, setMinPrice,
      maxPrice, setMaxPrice,
      sortOrder, setSortOrder
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};