import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Truck } from 'lucide-react';

export const TopBar: React.FC = () => {
  const [content, setContent] = useState<any>(null);
  const [freeShippingLimit, setFreeShippingLimit] = useState<number>(1500); // Varsayılan değer
  const { language } = useLanguage();

  // Site content'ten görünüm ayarları
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'home'), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  // Kargo ayarlarından limit (settings/shipping)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'shipping'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.freeShippingLimit !== undefined) {
          setFreeShippingLimit(data.freeShippingLimit);
        }
      }
    });
    return () => unsub();
  }, []);

  // Dinamik yükseklik ayarı
  useEffect(() => {
    const config = content?.[language];
    const height = `${config?.top_bar_height || 36}px`;
    document.documentElement.style.setProperty('--top-bar-height', height);
  }, [content, language]);

  const config = content?.[language];
  const message = language === 'tr'
    ? `₺${freeShippingLimit.toLocaleString('tr-TR')} ÜZERİ SİPARİŞLERDE ÜCRETSİZ KARGO`
    : `FREE SHIPPING ON ORDERS OVER ₺${freeShippingLimit.toLocaleString('tr-TR')}`;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[130] transition-all duration-700 ease-in-out overflow-hidden"
      style={{
        height: `${config?.top_bar_height || 36}px`,
        backgroundColor: config?.top_bar_bg || '#E5E1D1',
      }}
    >
      <div 
        className="h-full w-full flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] border-b border-black/5"
        style={{ color: config?.top_bar_text || '#4B3832' }}
      >
        <Truck size={12} strokeWidth={2.5} className="opacity-70" />
        {message}
      </div>
    </div>
  );
};