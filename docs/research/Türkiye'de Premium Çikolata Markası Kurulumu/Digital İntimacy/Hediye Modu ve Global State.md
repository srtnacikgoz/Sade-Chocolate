import React, { createContext, useContext, useState } from 'react';

const GiftContext = createContext();

export const GiftProvider = ({ children }) => {
  const [isGiftMode, setIsGiftMode] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  const toggleGiftMode = () => setIsGiftMode(!isGiftMode);

  return (
    <GiftContext.Provider value={{ isGiftMode, toggleGiftMode, giftMessage, setGiftMessage }}>
      {children}
    </GiftContext.Provider>
  );
};

export const useGift = () => useContext(GiftContext);

// --- Kullanım Örneği: Fiyat Bileşeni ---
const PriceDisplay = ({ price }) => {
  const { isGiftMode } = useGift();
  
  // Hediye modu aktifse fatura detaylarında fiyat gizlenir 
  if (isGiftMode) return <span className="text-stone-500 italic">Hediye Paketi (Fiyat Gizlendi)</span>;
  
  return <span className="font-bold">{price} TL</span>;
};