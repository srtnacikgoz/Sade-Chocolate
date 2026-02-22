import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { trackCartUpdate } from '../services/visitorTrackingService';
import { trackAddToCart, trackRemoveFromCart } from '../services/analyticsService';
import { trackPixelAddToCart, generateEventId } from '../services/metaPixelService';
import { sendCapiFromBrowser } from '../services/capiClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartCount: number;
  cartTotal: number;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearAllFavorites: () => void;
  removeFavorites: (productIds: string[]) => void;
  // Gift State
  isGift: boolean;
  setIsGift: (isGift: boolean) => void;
  giftMessage: string;
  setGiftMessage: (message: string) => void;
  hideInvoice: boolean;
  setHideInvoice: (hide: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('sade_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sade_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Gift State (Hafızadan Başlat)
  const [isGift, setIsGift] = useState(() => localStorage.getItem('sade_is_gift') === 'true');
  const [giftMessage, setGiftMessage] = useState(() => localStorage.getItem('sade_gift_message') || '');
  const [hideInvoice, setHideInvoice] = useState(true);
  const [hasGiftBag, setHasGiftBag] = useState(false); // Pierre Marcolini çanta opsiyonu

  // Otomatik Hafıza Kaydı
  React.useEffect(() => {
    localStorage.setItem('sade_cart', JSON.stringify(items));
    localStorage.setItem('sade_is_gift', String(isGift));
    localStorage.setItem('sade_gift_message', giftMessage);
  }, [items, isGift, giftMessage]);

  // Visitor Tracking - Sepet degisikliklerini takip et
  useEffect(() => {
    // Bos sepet veya ilk yukleme ise takip etme
    if (items.length === 0) return;

    const cartValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const cartItemsSummary = items.map(item => ({
      productId: item.id,
      productName: item.title || '',
      quantity: item.quantity,
      price: item.price
    }));

    trackCartUpdate(cartValue, cartItemCount, cartItemsSummary).catch((err) => {
      console.warn('Cart tracking failed:', err);
    });
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);

    // GA4 e-commerce event
    trackAddToCart({
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity,
      item_category: product.category
    });

    // Meta Pixel + CAPI (aynı eventId ile deduplication)
    const eventId = generateEventId();
    trackPixelAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity
    }, eventId);
    sendCapiFromBrowser({
      eventName: 'AddToCart',
      eventId,
      customData: {
        value: product.price * quantity,
        currency: 'TRY',
        contentIds: [product.id],
        contentType: 'product',
        contents: [{ id: product.id, quantity, item_price: product.price }],
      },
    });
  };

  const removeFromCart = (productId: string) => {
    const item = items.find(i => i.id === productId);
    if (item) {
      trackRemoveFromCart({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      });
    }
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
      setItems([]);
      setIsGift(false);
      setGiftMessage('');
      setHideInvoice(true);
  };

  // Favorileri localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('sade_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Login olunca Firestore'dan favorileri yükle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const favDoc = await getDoc(doc(db, 'users', user.uid));
          const cloudFavs = favDoc.data()?.favorites as string[] | undefined;
          if (cloudFavs && cloudFavs.length > 0) {
            // Local ve cloud favorileri birleştir
            setFavorites(prev => [...new Set([...prev, ...cloudFavs])]);
          }
        } catch {
          // Sessiz hata
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Favoriler değiştiğinde Firestore'a kaydet (login ise)
  useEffect(() => {
    const user = auth.currentUser;
    if (user && favorites.length >= 0) {
      setDoc(doc(db, 'users', user.uid), { favorites }, { merge: true }).catch(() => {
        // Sessiz hata
      });
    }
  }, [favorites]);

  // Favorites Logic
  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  const clearAllFavorites = () => {
    setFavorites([]);
  };

  const removeFavorites = (productIds: string[]) => {
    setFavorites(prev => prev.filter(id => !productIds.includes(id)));
  };

  // Calculate total count of items
  const cartCount = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
  
  // Calculate total price
  const cartTotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      cartCount,
      cartTotal,
      favorites,
      toggleFavorite,
      isFavorite,
      clearAllFavorites,
      removeFavorites,
      isGift,
      setIsGift,
      giftMessage,
      setGiftMessage,
      hideInvoice,
      setHideInvoice,
      hasGiftBag,
      setHasGiftBag
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};