import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HERO_IMAGE, COLLECTIONS } from '../constants';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { QuickViewModal } from '../components/QuickViewModal';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const Home: React.FC = () => {
  const { addToCart } = useCart();
  const { products } = useProducts();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { t } = useLanguage();

  // Pick the first product as featured or use a fallback
  const featuredProduct = useMemo(() => {
    return products.find(p => p.badge === 'New') || products[0];
  }, [products]);

  return (
    <main className="pt-16 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen">
      
      {/* Hero Section */}
      <section className="relative w-full aspect-[4/5] overflow-hidden mb-12">
        <img
          src={HERO_IMAGE}
          alt="Artisan dark chocolate bar breaking"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center pb-12">
          <h1 className="font-display text-4xl md:text-5xl text-white font-medium mb-2 leading-tight drop-shadow-sm whitespace-pre-line">
            {t('hero_title')}
          </h1>
          <p className="font-sans text-white/90 text-sm font-light mb-8 tracking-wide">
            {t('hero_subtitle')}
          </p>
          <Link to="/catalog" className="block bg-white text-brown-900 hover:bg-gray-100 dark:bg-brown-900 dark:text-white dark:hover:bg-opacity-90 w-full py-4 px-6 font-medium tracking-wide uppercase text-sm transition-all duration-300 shadow-lg active:scale-95">
            {t('shop_now')}
          </Link>
        </div>
      </section>

      {/* Collections Carousel */}
      <section className="px-5 mb-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl text-gray-900 dark:text-white">{t('collections')}</h2>
          <Link to="/catalog" className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-transparent hover:border-brown-900 hover:text-brown-900 transition-colors">
            {t('view_all')}
          </Link>
        </div>
        <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-4 -mx-5 px-5 snap-x snap-mandatory touch-pan-x">
          {COLLECTIONS.map((collection) => (
            <div key={collection.id} className="snap-start shrink-0 w-40 flex flex-col group cursor-pointer" onClick={() => addToCart(collection as any)}>
              <div className="relative w-40 h-52 bg-gray-50 dark:bg-dark-800 mb-3 overflow-hidden rounded-md shadow-sm">
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110 mix-blend-multiply dark:mix-blend-normal opacity-90"
                />
                 <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white text-black p-2 rounded-full shadow-md hover:scale-110 transition-transform">
                        <span className="material-icons-outlined text-sm block">add</span>
                    </button>
                 </div>
              </div>
              <h3 className="font-display text-lg leading-tight dark:text-gray-200">{collection.title}</h3>
              <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">{collection.description}</p>
              <span className="font-sans text-sm font-medium mt-2 text-brown-900 dark:text-white">{collection.currency}{collection.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Secret Section */}
      <section className="px-5 mb-16">
        <div className="bg-[#F9F7F5] dark:bg-dark-800 p-8 text-center flex flex-col items-center">
          <span className="font-sans text-brown-900 dark:text-brown-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">{t('secret_title')}</span>
          <h2 className="font-display text-3xl italic text-gray-900 dark:text-white mb-4">{t('secret_quote')}</h2>
          <p className="font-sans text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-xs mx-auto">
            {t('secret_desc')}
          </p>
          <Link to="/about" className="inline-block border border-brown-900 text-brown-900 hover:bg-brown-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors px-6 py-3 text-xs uppercase tracking-widest font-sans">
            {t('read_story')}
          </Link>
        </div>
      </section>

      {/* Featured Product */}
      {featuredProduct && (
        <section className="px-5 mb-10">
            <h2 className="font-display text-2xl text-gray-900 dark:text-white mb-6 text-center">{t('featured_month')}</h2>
            <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full relative aspect-square bg-white dark:bg-dark-800 shadow-sm group">
                <img 
                src={featuredProduct.image} 
                alt={featuredProduct.title}
                className="w-full h-full object-contain p-8 transform group-hover:scale-105 transition-transform duration-500"
                />
                {featuredProduct.badge && (
                    <div className="absolute top-4 left-4 bg-brown-900 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider font-sans">
                        {featuredProduct.badge === 'New' ? t('badge_new') : featuredProduct.badge}
                    </div>
                )}
                
                {/* Quick View Trigger */}
                <button 
                    onClick={() => setQuickViewProduct(featuredProduct)}
                    className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-full text-gray-500 dark:text-gray-300 hover:text-brown-900 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                    <span className="material-icons-outlined text-xl">visibility</span>
                </button>

            </div>
            <div className="w-full text-center md:text-left">
                <h3 className="font-display text-xl text-gray-900 dark:text-white mb-2">{featuredProduct.title}</h3>
                <p className="font-sans text-sm text-gray-500 dark:text-gray-400 mb-4">
                {featuredProduct.description}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                <span className="text-lg font-medium text-brown-900 dark:text-white">{featuredProduct.currency}{featuredProduct.price}</span>
                <button 
                    onClick={() => addToCart(featuredProduct)}
                    className="bg-black text-white dark:bg-white dark:text-black w-10 h-10 flex items-center justify-center rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                    <span className="material-icons-outlined text-sm">add</span>
                </button>
                </div>
            </div>
            </div>
        </section>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-black py-12 px-5 text-center max-w-md mx-auto mb-20 border-t border-gray-100 dark:border-gray-800">
        <div className="font-display font-bold text-xl tracking-tight text-brown-900 dark:text-white mb-6">
            Sade Chocolate
        </div>
        
        {/* Social Icons */}
        <div className="flex justify-center space-x-6 mb-8">
            <a 
              href="https://www.google.com/maps/search/?api=1&query=Yeşilbahçe+Mahallesi,+Çınarlı+Caddesi+47/A,+07160+Muratpaşa,+Antalya" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-brown-900 dark:hover:text-white"
            >
              <i className="material-icons-outlined text-lg">place</i>
            </a>
            <a 
              href="https://instagram.com/sade.patisserie" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-brown-900 dark:hover:text-white"
            >
              <i className="material-icons-outlined text-lg">camera_alt</i>
            </a> 
            <a 
              href="mailto:bilgi@sadepatisserie.com" 
              className="text-gray-400 hover:text-brown-900 dark:hover:text-white"
            >
              <i className="material-icons-outlined text-lg">alternate_email</i>
            </a>
        </div>

        {/* Legal Links */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-8 max-w-[280px] mx-auto">
          <Link to="/legal/pre-info" className="text-[10px] text-gray-500 hover:text-brown-900 dark:hover:text-white uppercase tracking-wider transition-colors">{t('legal_pre_info')}</Link>
          <Link to="/legal/distance-sales" className="text-[10px] text-gray-500 hover:text-brown-900 dark:hover:text-white uppercase tracking-wider transition-colors">{t('legal_distance_sales')}</Link>
          <Link to="/legal/kvkk" className="text-[10px] text-gray-500 hover:text-brown-900 dark:hover:text-white uppercase tracking-wider transition-colors">{t('legal_kvkk')}</Link>
          <Link to="/legal/refund" className="text-[10px] text-gray-500 hover:text-brown-900 dark:hover:text-white uppercase tracking-wider transition-colors">{t('legal_refund')}</Link>
        </div>

        <p className="font-sans text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider">
            {t('footer_rights')}
        </p>
      </footer>

      <QuickViewModal 
        product={quickViewProduct} 
        isOpen={!!quickViewProduct} 
        onClose={() => setQuickViewProduct(null)} 
      />
    </main>
  );
};