import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, ViewMode, ProductBadge } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode, onQuickView }) => {
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<ProductBadge[]>([]);

  const isFav = isFavorite(product.id);

  // Fetch badges from Firebase
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const q = query(collection(db, 'product_badges'), orderBy('priority', 'asc'));
        const snapshot = await getDocs(q);
        const badgeData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ProductBadge[];
        setBadges(badgeData.filter(b => b.active));
      } catch (error) {
        console.error('Badge verileri yüklenemedi:', error);
      }
    };
    fetchBadges();
  }, []);

  // Get current badge info
  const currentBadge = product.badge ? badges.find(b => b.id === product.badge) : null;

  // Hover durumuna göre görseli belirle
  const currentImage = isHovered && product.alternateImage ? product.alternateImage : product.image;

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent, qty: number = 1) => {
    e.preventDefault();
    e.stopPropagation();
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

  // 1. GRID VIEW (Katalog Varsayılan Görünüm)
  if (viewMode === ViewMode.GRID) {
    return (
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group bg-cream-50 dark:bg-dark-800 rounded-xl shadow-luxurious hover:shadow-hover transition-all duration-500 overflow-hidden flex flex-col h-full border border-gold/15 relative cursor-pointer"
      >
        <div className="relative aspect-[4/5] bg-[#F9F9F9] dark:bg-gray-800 overflow-hidden">

          {/* Rozetler */}
          {currentBadge && (
            <span
              className="absolute top-0 left-0 text-[10px] font-bold px-3 py-1 uppercase tracking-widest z-20"
              style={{ backgroundColor: currentBadge.bgColor, color: currentBadge.textColor }}
            >
              {currentBadge.name[language as 'tr' | 'en' | 'ru']}
            </span>
          )}

          {/* Ürün Görseli */}
          <img
            src={currentImage}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-all duration-300 ease-out relative z-10"
          />
{/* Altına şu katmanı ekle: Üzerine gelince oluşan sıcak bir iç gölge */}
<div className="absolute inset-0 bg-mocha-900/0 group-hover:bg-mocha-900/5 transition-colors duration-700 z-15" />

          {/* AKSİYON BUTONLARI (Favori & Quick View) - Geri Getirildi */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
            {/* Favori Butonu */}
            <button 
                onClick={handleToggleFav}
                className={`w-9 h-9 flex items-center justify-center bg-white dark:bg-black/70 rounded-full transition-colors shadow-sm ${isFav ? 'text-red-500 hover:text-red-600' : 'text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400'}`}
                aria-label="Favorilere Ekle"
            >
              <span className={`material-icons-outlined text-lg`}>
                  {isFav ? 'favorite' : 'favorite_border'}
              </span>
            </button>
            
            {/* Hızlı Bakış Butonu */}
            <button 
                onClick={handleQuickView}
                className="w-9 h-9 flex items-center justify-center bg-white dark:bg-black/70 rounded-full text-gray-500 dark:text-gray-300 hover:text-brown-900 dark:hover:text-white transition-colors shadow-sm"
                aria-label="Hızlı Bakış"
            >
              <span className="material-icons-outlined text-lg">visibility</span>
            </button>
          </div>
        </div>

        {/* Alt Bilgiler */}
        <div className="p-4 flex flex-col flex-grow relative z-20 bg-cream-50 dark:bg-dark-800">
          <h3 className="font-display text-lg font-semibold leading-tight mb-1 text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[3rem]">
            {product.title}
          </h3>
          <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
            {product.description}
          </p>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
              {product.originalPrice && (
                 <span className="text-xs line-through text-gray-400 dark:text-gray-500">{product.currency}{product.originalPrice.toFixed(2)}</span>
              )}
              <span className={`text-base font-semibold ${product.originalPrice ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {product.currency || '₺'}{product.price.toFixed(2)}
              </span>
            </div>
            <button
              aria-label="Sepete Ekle"
              onClick={(e) => handleAddToCart(e)}
              className="bg-gray-900 dark:bg-white text-white dark:text-black w-9 h-9 flex items-center justify-center rounded-full hover:bg-gold dark:hover:bg-gold hover:text-white dark:hover:text-white transition-colors duration-300 shadow-sm"
            >
              <span className="material-icons-outlined text-lg">add</span>
            </button>
          </div>
          
          {/* Mobil İçin Geniş Buton */}
          <button 
  onClick={(e) => handleAddToCart(e)}
  className="w-full mt-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-mocha-900 dark:text-gray-100 border border-gold/20 bg-cream-50 dark:bg-transparent rounded-lg hover:bg-mocha-900 hover:text-white dark:hover:bg-gold transition-all duration-300 shadow-sm"
>
            {t('add_to_cart')}
          </button>
        </div>
      </div>
    );
  }

  // 2. LIST VIEW
  if (viewMode === ViewMode.LIST) {
    return (
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group bg-white dark:bg-dark-800 rounded-xl shadow-luxurious hover:shadow-hover transition-all duration-300 overflow-hidden flex flex-col border border-gray-50 dark:border-gray-800 relative cursor-pointer"
      >
        <div className="relative aspect-[3/2] bg-[#F9F9F9] dark:bg-gray-800 overflow-hidden">
          {currentBadge && (
            <span
              className="absolute top-4 left-4 text-xs font-bold px-3 py-1.5 uppercase tracking-widest z-20 rounded-full"
              style={{ backgroundColor: currentBadge.bgColor, color: currentBadge.textColor }}
            >
              {currentBadge.name[language as 'tr' | 'en' | 'ru']}
            </span>
          )}
          <img
            src={currentImage}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 z-10"
          />

          {/* Liste Görünümü Butonları */}
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
            <button 
                onClick={handleToggleFav}
                className={`w-10 h-10 flex items-center justify-center bg-white dark:bg-black/70 rounded-full transition-colors shadow-sm ${isFav ? 'text-red-500 hover:text-red-600' : 'text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400'}`}
            >
              <span className="material-icons-outlined text-xl">{isFav ? 'favorite' : 'favorite_border'}</span>
            </button>
            <button 
                onClick={handleQuickView}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-black/70 rounded-full text-gray-500 dark:text-gray-300 hover:text-brown-900 dark:hover:text-white transition-colors shadow-sm"
            >
              <span className="material-icons-outlined text-xl">visibility</span>
            </button>
          </div>
        </div>
        
        {/* Liste Alt İçerik */}
        <div className="p-5 flex flex-col z-20 bg-white dark:bg-dark-800">
          <h3 className="font-display text-2xl font-semibold leading-tight mb-2 text-gray-900 dark:text-gray-100">
            {product.title}
          </h3>
          <p className="font-sans text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            <span className="opacity-80">Origin: {product.origin}, Tasting Notes: {product.tastingNotes}.</span> {product.detailedDescription}
          </p>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              {product.originalPrice && (
                 <span className="text-sm line-through text-gray-400 dark:text-gray-500 block">{product.currency}{product.originalPrice.toFixed(2)}</span>
              )}
              <span className={`text-xl font-semibold ${product.originalPrice ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {product.currency || '₺'}{product.price.toFixed(2)}
              </span>
            </div>
          </div>
          <button 
            onClick={(e) => handleAddToCart(e)}
            className="w-full py-3 bg-gold text-white font-semibold uppercase tracking-wider rounded-lg hover:opacity-90 transition-colors duration-300 shadow-lg text-sm"
          >
            {t('add_to_cart')}
          </button>
        </div>
      </div>
    );
  }

  // 3. LIST QTY VIEW (Liste + Adet)
  if (viewMode === ViewMode.LIST_QTY) {
    return (
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group bg-white dark:bg-dark-800 rounded-xl shadow-soft hover:shadow-hover transition-all duration-300 overflow-hidden flex border border-gray-50 dark:border-gray-800 items-center p-3 relative cursor-pointer"
      >
        <div className="relative w-24 h-24 flex-shrink-0 bg-[#F9F9F9] dark:bg-gray-800 rounded-lg overflow-hidden mr-3">
          {currentBadge && (
            <span
              className="absolute top-0 left-0 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-widest z-20 rounded-tl-lg rounded-br-lg"
              style={{ backgroundColor: currentBadge.bgColor, color: currentBadge.textColor }}
            >
              {currentBadge.name[language as 'tr' | 'en' | 'ru']}
            </span>
          )}
          <img
            src={currentImage}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 z-10"
          />
          {/* Küçük Liste Görünümü Butonları */}
          <div className="absolute top-1 right-1 flex flex-col gap-1 z-30">
             <button 
                onClick={handleToggleFav}
                className={`w-6 h-6 flex items-center justify-center bg-white dark:bg-black/70 rounded-full transition-colors shadow-sm ${isFav ? 'text-red-500 hover:text-red-600' : 'text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400'}`}
             >
                <span className="material-icons-outlined text-xs">{isFav ? 'favorite' : 'favorite_border'}</span>
             </button>
             <button 
                onClick={handleQuickView}
                className="w-6 h-6 flex items-center justify-center bg-white dark:bg-black/70 rounded-full text-gray-500 dark:text-gray-300 hover:text-brown-900 dark:hover:text-white transition-colors shadow-sm"
             >
                <span className="material-icons-outlined text-xs">visibility</span>
             </button>
          </div>
        </div>
        <div className="flex-grow flex flex-col justify-center">
          <h3 className="font-display text-base font-semibold leading-tight mb-1 text-gray-900 dark:text-gray-100 line-clamp-2">
            {product.title}
          </h3>
          <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
            {product.description}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              {product.originalPrice && (
                 <span className="text-xs line-through text-gray-400 dark:text-gray-500">{product.currency}{product.originalPrice.toFixed(2)}</span>
              )}
              <span className={`text-sm font-semibold ${product.originalPrice ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {product.currency || '₺'}{product.price.toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-icons-outlined text-base">remove</span>
              </button>
              <input 
                className="w-8 text-center bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 dark:text-white"
                type="number" 
                min="1"
                value={quantity}
                readOnly
              />
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-icons-outlined text-base">add</span>
              </button>
              <button 
                onClick={(e) => handleAddToCart(e, quantity)}
                className="ml-2 px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {t('add_to_cart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};