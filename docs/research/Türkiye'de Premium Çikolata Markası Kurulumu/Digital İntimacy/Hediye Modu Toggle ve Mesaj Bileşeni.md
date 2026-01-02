import React from 'react';
import { useGift } from './GiftContext';

const GiftToggle = () => {
  const { isGiftMode, toggleGiftMode, setGiftMessage } = useGift();

  return (
    <div className="border-t border-stone-200 py-4 mt-6">
      <div className="flex items-center justify-between">
        <label className="flex flex-col">
          <span className="font-medium text-stone-900">Bu bir hediye mi?</span>
          <span className="text-xs text-stone-500">Fiyatları gizleriz ve notunuzu ekleriz.</span>
        </label>
        <button 
          onClick={toggleGiftMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isGiftMode ? 'bg-amber-800' : 'bg-stone-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGiftMode ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {isGiftMode && (
        <div className="mt-4 animate-fade-in">
          <textarea
            placeholder="Kişisel mesajınızı buraya yazın veya video linki ekleyin..."
            className="w-full border-stone-300 rounded-md shadow-sm focus:ring-amber-800 focus:border-amber-800"
            rows={3}
            onChange={(e) => setGiftMessage(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
