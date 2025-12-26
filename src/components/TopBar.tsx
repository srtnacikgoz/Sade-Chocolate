import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Truck } from 'lucide-react';

export const TopBar: React.FC = () => {
  const [content, setContent] = useState<any>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'home'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setContent(data);
        const config = data?.[language];
        
        // Dinamik Yükseklik Yönetimi
        const height = config?.top_bar_message ? `${config?.top_bar_height || 36}px` : '0px';
        document.documentElement.style.setProperty('--top-bar-height', height);
      }
    });
    return () => unsub();
  }, [language]);

  const config = content?.[language];
  const message = config?.top_bar_message;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[130] transition-all duration-700 ease-in-out overflow-hidden`}
  
    style={{ 
      height: message ? `${config?.top_bar_height || 36}px` : '0px',
      backgroundColor: config?.top_bar_bg || '#E5E1D1',
      opacity: message ? 1 : 0,
      visibility: message ? 'visible' : 'hidden' // Görünmezken tıklamayı engeller
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