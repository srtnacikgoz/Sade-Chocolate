import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, ViewMode } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode, onQuickView }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const { t } = useLanguage();
  
  const isFav = isFavorite(product.id);
  const isOut = product.isOutOfStock;

  const handleAddToCart = (e: React.MouseEvent, qty: number = 1) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOut) return;
    addToCart(product, qty);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
        onQuickView(product);
    }
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  }

  const getBadgeText = (badge: string) => {
      if (badge === 'New') return t('badge_new');
      if (badge === 'Sale') return t('badge_sale');
      return badge;
  };

  const OutOfStockOverlay = () => (
      <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 transition-all p-4 text-center">
          <span className="material-icons-outlined text-brown-900 dark:text-gold mb-1 text-xl">inventory_2</span>
          <div className="bg-brown-900 dark:bg-white text-white dark:text-black text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest rounded shadow-lg">
              Geçici Olarak Tükendi
          </div>
      </div>
  );

  // 1. GRID VIEW
  if (viewMode === ViewMode.GRID) {
    return (
      <Link 
        to={`/product/${product.id}`}
        className={`group bg-white dark:bg-dark-800 rounded-2xl shadow-soft hover:shadow-luxurious transition-all duration-500 overflow-hidden flex flex-col h-full border border-gray-50 dark:border-gray-800 relative ${isOut ? 'grayscale-[0.3]' : ''}`}
      >
        <div className="relative aspect-[4/5] bg-[#F9F9F9] dark:bg-gray-800 overflow-hidden">
          {isOut && <OutOfStockOverlay />}
          {product.badge && (
            <span className={`absolute top-0 left-0 text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em] z-10 shadow-sm ${product.badge === 'New' ? 'bg-gold' : 'bg-brown-900'}`}>
              {getBadgeText(product.badge)}
            </span>
          )}
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000 ease-in-out"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-30 opacity-0 lg:group-hover:opacity-100 transition-opacity translate-y-2 lg:group-hover:translate-y-0 duration-500">
            <button 
                onClick={handleToggleFav}
                className={`w-10 h-10 bg-white/90 dark:bg-black/40 backdrop-blur-md rounded-full transition-all hover:scale-110 flex items-center justify-center ${isFav ? 'text-red-500 shadow-md' : 'text-gray-400 dark:text-gray-300 hover:text-red-500'}`}
            >
              <span className={`material-icons-outlined text-xl block`}>{isFav ? 'favorite' : 'favorite_border'}</span>
            </button>
            <button 
                onClick={handleQuickView}
                className="w-10 h-10 bg-white/90 dark:bg-black/40 backdrop-blur-md rounded-full text-gray-400 dark:text-gray-300 hover:text-brown-900 dark:hover:text-white transition-all hover:scale-110 shadow-sm flex items-center justify-center"
            >
              <span className="material-icons-outlined text-xl block">visibility</span>
            </button>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="font-display text-lg font-bold leading-tight mb-1 text-gray-900 dark:text-gray-100 line-clamp-2 italic">{product.title}</h3>
          <p className="font-sans text-[10px] text-gray-500 dark:text-gray-400 mb-6 line-clamp-1 uppercase tracking-widest">{product.description}</p>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
              {product.originalPrice && <span className="text-[10px] line-through text-gray-400 mb-0.5">₺{product.originalPrice.toFixed(2)}</span>}
              <span className={`text-lg font-bold font-display ${product.originalPrice ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                ₺{product.price.toFixed(2)}
              </span>
            </div>
            {!isOut && (
                <button
                    onClick={(e) => handleAddToCart(e)}
                    className="bg-brown-900 dark:bg-white text-white dark:text-black w-10 h-10 rounded-full hover:bg-gold dark:hover:bg-gold hover:text-white dark:hover:text-white transition-all duration-300 shadow-lg active:scale-90 flex items-center justify-center"
                >
                    <span className="material-icons-outlined text-xl block">add</span>
                </button>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // 3. LIST QTY VIEW
  if (viewMode === ViewMode.LIST_QTY) {
    return (
      <div className={`group bg-white dark:bg-dark-800 rounded-3xl shadow-soft hover:shadow-luxurious transition-all duration-500 overflow-hidden flex border border-gray-50 dark:border-gray-800 items-center p-4 relative ${isOut ? 'grayscale-[0.4]' : ''}`}>
        <Link 
          to={`/product/${product.id}`}
          className="relative w-28 h-28 flex-shrink-0 bg-[#F9F9F9] dark:bg-gray-800 rounded-2xl overflow-hidden mr-6"
        >
           {isOut && <OutOfStockOverlay />}
           {product.badge && (
            <span className={`absolute top-0 left-0 text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest z-10 rounded-br-2xl ${product.badge === 'New' ? 'bg-gold' : 'bg-brown-900'}`}>
              {getBadgeText(product.badge)}
            </span>
          )}
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
          />
        </Link>
        <div className="flex-grow flex flex-col justify-center min-w-0 pr-2">
          <div className="flex justify-between items-start gap-4 mb-1">
            <Link to={`/product/${product.id}`} className="font-display text-xl font-bold text-gray-900 dark:text-white truncate italic hover:text-gold transition-colors">{product.title}</Link>
            <button onClick={handleToggleFav} className={`text-gray-300 transition-colors ${isFav ? 'text-red-500' : 'hover:text-red-400'}`}>
               <span className="material-icons-outlined text-2xl">{isFav ? 'favorite' : 'favorite_border'}</span>
            </button>
          </div>
          <p className="font-sans text-[11px] text-gray-500 dark:text-gray-400 mb-4 truncate uppercase tracking-[0.1em]">{product.description}</p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xl font-bold font-display text-gray-900 dark:text-white italic">
              ₺{product.price.toFixed(2)}
            </span>
            
            <div className="flex items-center gap-3">
              {!isOut && (
                  <div className="flex items-center bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-gray-700 px-2 py-1">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 text-gray-400 hover:text-brown-900 transition-colors"><span className="material-icons-outlined text-sm block">remove</span></button>
                      <span className="w-8 text-center text-sm font-bold text-gray-700 dark:text-white">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 text-gray-400 hover:text-brown-900 transition-colors"><span className="material-icons-outlined text-sm block">add</span></button>
                  </div>
              )}
              <button 
                disabled={isOut}
                onClick={(e) => handleAddToCart(e, quantity)}
                className={`px-6 py-3 text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-md ${isOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brown-900 text-white hover:bg-gold active:scale-95'}`}
              >
                {isOut ? 'Tükendi' : t('add_to_cart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};