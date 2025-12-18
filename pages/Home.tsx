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

  const featuredProduct = useMemo(() => {
    return products.find(p => p.badge === 'New') || products[0];
  }, [products]);

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen">
      
      {/* Hero Section */}
      <section className="relative w-full aspect-[4/5] lg:aspect-[21/9] overflow-hidden mb-16 rounded-[40px] lg:rounded-[60px] shadow-luxurious group">
        <img
          src={HERO_IMAGE}
          alt="Artisan dark chocolate bar"
          className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-[2s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-end p-8 pb-16 lg:pb-24 text-center">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="font-display text-5xl lg:text-7xl text-white font-medium mb-4 leading-tight drop-shadow-lg italic">
              {t('hero_title')}
            </h1>
            <p className="font-sans text-white/90 text-sm lg:text-base font-light mb-10 tracking-widest uppercase">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/catalog" className="inline-block bg-white text-brown-900 hover:bg-gold hover:text-white py-5 px-12 font-bold tracking-[0.2em] uppercase text-xs transition-all duration-500 shadow-2xl active:scale-95 rounded-full">
                {t('shop_now')}
              </Link>
              <Link to="/about" className="inline-block border-2 border-white/40 text-white hover:bg-white hover:text-brown-900 py-5 px-12 font-bold tracking-[0.2em] uppercase text-xs transition-all duration-500 rounded-full">
                {t('read_story')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Section - 3 cols desktop */}
      <section className="mb-24 px-2 sm:px-0">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.4em] mb-2 block">Premium Selection</span>
            <h2 className="font-display text-3xl lg:text-5xl text-gray-900 dark:text-white italic leading-none">{t('collections')}</h2>
          </div>
          <Link to="/catalog" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gold border-b border-transparent hover:border-gold transition-all pb-1">
            {t('view_all')}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {COLLECTIONS.map((collection) => (
            <div 
              key={collection.id} 
              className="group cursor-pointer bg-gray-50 dark:bg-dark-800 rounded-[40px] overflow-hidden transition-all duration-500 hover:shadow-luxurious border border-transparent hover:border-gray-100 dark:hover:border-gray-700" 
              onClick={() => addToCart(collection as any)}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white text-black w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-500">
                        <span className="material-icons-outlined">add</span>
                    </div>
                </div>
              </div>
              <div className="p-8 text-center">
                <h3 className="font-display text-2xl mb-2 dark:text-white italic">{collection.title}</h3>
                <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-4 tracking-wide">{collection.description}</p>
                <span className="font-sans text-lg font-bold text-brown-900 dark:text-gold">{collection.currency}{collection.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="mb-24">
        <div className="bg-brown-900 dark:bg-dark-800 rounded-[60px] p-12 lg:p-24 text-center flex flex-col items-center relative overflow-hidden shadow-luxurious">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <span className="font-sans text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-6 relative z-10">{t('secret_title')}</span>
          <h2 className="font-display text-4xl lg:text-6xl italic text-white mb-8 relative z-10 leading-tight max-w-4xl">
            {t('secret_quote')}
          </h2>
          <p className="font-sans text-sm lg:text-base text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto relative z-10 font-light">
            {t('secret_desc')}
          </p>
          <div className="flex gap-4 relative z-10 items-center">
             <div className="h-px w-12 bg-gold/50"></div>
             <span className="font-handwriting text-3xl text-gold">Sertan Açıkgöz</span>
             <div className="h-px w-12 bg-gold/50"></div>
          </div>
        </div>
      </section>

      {/* Featured Product */}
      {featuredProduct && (
        <section className="mb-20 px-2 sm:px-0">
            <h2 className="font-display text-3xl lg:text-5xl text-gray-900 dark:text-white mb-12 text-center italic">{t('featured_month')}</h2>
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center bg-gray-50 dark:bg-dark-800 rounded-[60px] p-8 lg:p-16 border border-gray-100 dark:border-gray-700 shadow-soft">
              <div className="w-full lg:w-1/2 relative aspect-square bg-white dark:bg-dark-900 rounded-[40px] shadow-soft group overflow-hidden border border-gray-100 dark:border-gray-800">
                  <img 
                    src={featuredProduct.image} 
                    alt={featuredProduct.title}
                    className="w-full h-full object-contain p-12 transform group-hover:scale-105 transition-transform duration-1000"
                  />
                  {featuredProduct.badge && (
                      <div className="absolute top-8 left-8 bg-brown-900 dark:bg-gold text-white dark:text-black text-[10px] font-bold px-4 py-2 uppercase tracking-widest rounded-full shadow-lg z-10">
                          {featuredProduct.badge === 'New' ? t('badge_new') : featuredProduct.badge}
                      </div>
                  )}
                  <button 
                      onClick={() => setQuickViewProduct(featuredProduct)}
                      className="absolute bottom-8 right-8 w-14 h-14 bg-white/95 dark:bg-black/60 backdrop-blur-md rounded-full text-gray-500 dark:text-gray-200 hover:text-brown-900 dark:hover:text-gold transition-all shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 z-10"
                  >
                      <span className="material-icons-outlined text-2xl">visibility</span>
                  </button>
              </div>
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                  <span className="text-gold text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block">Artisan Selection</span>
                  <h3 className="font-display text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 italic leading-tight">{featuredProduct.title}</h3>
                  <p className="font-sans text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed italic">
                  "{featuredProduct.description}"
                  </p>
                  <div className="flex items-center justify-center lg:justify-start gap-8">
                    <span className="font-display text-5xl font-bold text-brown-900 dark:text-gold italic">{featuredProduct.currency}{featuredProduct.price.toFixed(2)}</span>
                    <button 
                        onClick={() => addToCart(featuredProduct)}
                        className="bg-brown-900 text-white dark:bg-white dark:text-black px-12 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.3em] shadow-2xl hover:bg-gold dark:hover:bg-gold hover:text-white transition-all active:scale-95"
                    >
                        {t('add_to_cart')}
                    </button>
                  </div>
              </div>
            </div>
        </section>
      )}
      
      {/* Footer */}
      <footer className="py-20 text-center border-t border-gray-100 dark:border-gray-800 mt-20">
        <div className="font-display font-bold text-4xl tracking-tight text-brown-900 dark:text-white mb-10 italic">
            Sade <span className="text-gold">Chocolate</span>
        </div>
        
        {/* Social Icons */}
        <div className="flex justify-center space-x-8 mb-12">
            <a href="https://www.google.com/maps/search/?api=1&query=Antalya" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 dark:bg-dark-800 text-gray-400 hover:text-gold transition-all shadow-sm">
              <i className="material-icons-outlined">place</i>
            </a>
            <a href="https://instagram.com/sadepatisserie" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 dark:bg-dark-800 text-gray-400 hover:text-gold transition-all shadow-sm">
              <i className="material-icons-outlined">camera_alt</i>
            </a> 
            <a href="mailto:bilgi@sadepatisserie.com" className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 dark:bg-dark-800 text-gray-400 hover:text-gold transition-all shadow-sm">
              <i className="material-icons-outlined">alternate_email</i>
            </a>
        </div>

        <p className="font-sans text-[10px] text-gray-300 dark:text-gray-600 uppercase tracking-[0.4em] mb-4">
            Powered by Sade Patisserie • Antalya
        </p>
        <p className="font-sans text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
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