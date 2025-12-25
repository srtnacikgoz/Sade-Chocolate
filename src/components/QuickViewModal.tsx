import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  [key: string]: any; // Esneklik sağlamak için eklendi
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { t } = useLanguage();

  if (!isOpen || !product) return null;

  const isOut = product.isOutOfStock;

  const handleAddToCart = () => {
    if (isOut) return;
    addToCart(product, quantity);
    setQuantity(1);
    onClose();
  };
  
  const getBadgeText = (badge: string) => {
      if (badge === 'New') return t('badge_new');
      if (badge === 'Sale') return t('badge_sale');
      return badge;
  };

  const sensoryKeys: (keyof NonNullable<Product['sensory']>)[] = ['intensity', 'sweetness', 'creaminess', 'fruitiness', 'acidity', 'crunch'];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-dark-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-fade-in transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
            <div className="relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-gray-900 dark:text-white hover:bg-white dark:hover:bg-black transition-colors shadow-sm"
                >
                    <span className="material-icons-outlined text-xl">close</span>
                </button>
                <div className={`aspect-[16/9] w-full bg-gray-100 dark:bg-gray-800 ${isOut ? 'grayscale-[0.5]' : ''}`}>
                    {product.video ? (
                        <video 
                            src={product.video} 
                            autoPlay loop muted playsInline 
                            className="w-full h-full object-cover"
                            poster={product.image}
                        />
                    ) : (
                        <img 
                            src={product.image} 
                            alt={product.title} 
                            className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                        />
                    )}
                </div>
                {isOut && (
                    <div className="absolute inset-x-0 bottom-0 bg-brown-900 text-white text-center py-2 text-[10px] font-bold uppercase tracking-widest">
                        Bu Ürün Geçici Olarak Stokta Yok
                    </div>
                )}
            </div>
            
            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        {product.badge && (
                            <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-wider bg-gold text-white rounded-sm">
                                {getBadgeText(product.badge)}
                            </span>
                        )}
                        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white leading-tight">{product.title}</h2>
                    </div>
                    <div className="text-right">
                         {product.originalPrice && <span className="block text-sm line-through text-gray-400">{product.currency}{product.originalPrice.toFixed(2)}</span>}
                        <span className={`text-xl font-bold ${product.originalPrice ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                            {product.currency}{product.price.toFixed(2)}
                        </span>
                    </div>
                </div>

                <p className="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    {product.detailedDescription || product.description}
                    {product.tastingNotes && <span className="block mt-2 italic text-gray-400">Notes: {product.tastingNotes}</span>}
                </p>

                {product.sensory && (
                    <div className="mb-6">
                        <h4 className="text-xs font-bold uppercase text-gray-900 dark:text-white mb-3 tracking-wider">{t('sensory_profile')}</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {sensoryKeys.map(key => {
                                const value = product.sensory?.[key];
                                if (value === undefined) return null;
                                return (
                                    <div key={key} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 uppercase"><span>{t(`sensory_${key}` as any)}</span></div>
                                        <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gold rounded-full transition-all duration-1000 ease-out" style={{ width: `${value}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-4 border-t border-gray-100 dark:border-gray-800 pt-6 mt-2">
                    {!isOut && (
                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-500 hover:text-brown-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                                <span className="material-icons-outlined text-sm">remove</span>
                            </button>
                            <span className="mx-4 font-sans font-medium text-gray-900 dark:text-white min-w-[1rem] text-center">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="text-gray-500 hover:text-brown-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                                <span className="material-icons-outlined text-sm">add</span>
                            </button>
                        </div>
                    )}
                    <button 
                        disabled={isOut}
                        onClick={handleAddToCart}
                        className={`flex-1 py-3 font-bold uppercase tracking-widest text-xs rounded-lg shadow-lg transition-all ${isOut ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' : 'bg-brown-900 text-white dark:bg-white dark:text-black hover:bg-gold active:scale-95'}`}
                    >
                        {isOut ? 'Tükendi' : t('add_to_cart')}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};