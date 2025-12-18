import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { ViewMode, Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const Favorites: React.FC = () => {
  const { favorites, addToCart, setIsCartOpen } = useCart();
  const { products } = useProducts();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { t } = useLanguage();

  const favoriteProducts = useMemo(() => {
    return favorites.map(favId => {
        const baseId = favId.split('_')[0];
        const productData = products.find(p => p.id === baseId);
        if (productData) {
            return { ...productData, id: favId };
        }
        return null;
    }).filter(Boolean) as Product[]; 
  }, [favorites, products]);

  const handleSmartAction = (action: 'cheapest' | 'expensive' | 'aesthetic' | 'all' | 'curated') => {
    if (favoriteProducts.length === 0) return;
    let targetProduct: Product | undefined;
    switch (action) {
        case 'cheapest':
            targetProduct = [...favoriteProducts].sort((a, b) => a.price - b.price)[0];
            if (targetProduct) addToCart(targetProduct);
            break;
        case 'expensive':
            targetProduct = [...favoriteProducts].sort((a, b) => b.price - a.price)[0];
            if (targetProduct) addToCart(targetProduct);
            break;
        case 'aesthetic':
            targetProduct = favoriteProducts.find(p => p.category === 'gift-box') 
                         || favoriteProducts.find(p => p.category === 'truffle')
                         || favoriteProducts[Math.floor(Math.random() * favoriteProducts.length)];
            if (targetProduct) addToCart(targetProduct);
            break;
        case 'all':
            favoriteProducts.forEach(p => addToCart(p));
            setIsCartOpen(true);
            return;
        case 'curated':
            const favoriteNames = favoriteProducts.slice(0, 6).map(p => p.title).join(', ');
            const customBoxProduct: Product = {
                id: `custom-curated-${Date.now()}`,
                title: t('custom_box_title'),
                description: t('custom_box_desc'),
                price: 750.00,
                currency: '₺',
                category: 'gift-box',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZczwKf5voGVSZ7Ysr3Mi6zR_p7ZiwwS06oIjdi_NS1FBV5mNJrZydaIQY4p3zdJABhzonyJx3hBP_jsYC_MKAmsWH2XYEjNr-HK-Bd19b3uhvT_zuhO5R6bw4xF7MePdhW6zIYskcHEB2HzG4FA7eMSK9K8Tj4QTlEvFOjWUWHu7NV36TfBrS_t-ubgL7zqH-uRNINJviAJxVMCUz3CWa1ESfajTarCel5KmcrWu6_PygICbM0_knskpk2lBY-7N5ygj-lsHuA38',
                detailedDescription: `${t('custom_box_content')} ${favoriteNames}.`,
                badge: 'Special',
                ingredients: 'Custom selection based on user favorites.',
                allergens: 'Contains milk, soy, nuts based on selection.'
            };
            addToCart(customBoxProduct);
            setIsCartOpen(true);
            break;
    }
  };

  if (favorites.length === 0) {
    return (
        <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-40 h-40 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mb-10 shadow-inner">
                <span className="material-icons-outlined text-7xl text-gray-200 dark:text-gray-700">favorite_border</span>
            </div>
            <h2 className="font-display text-5xl text-gray-900 dark:text-white mb-6 italic tracking-tighter">{t('favorites_empty_title')}</h2>
            <p className="font-sans text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-lg mx-auto leading-relaxed">
                {t('favorites_empty_desc')}
            </p>
            <Link 
                to="/catalog"
                className="px-14 py-5 bg-brown-900 text-white dark:bg-gold dark:text-black font-bold uppercase tracking-[0.4em] text-[11px] rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95"
            >
                {t('discover_products')}
            </Link>
        </main>
    );
  }

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen">
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-10">
            <div>
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-3 block">Sizin Seçimleriniz</span>
              <h2 className="font-display text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white italic tracking-tighter">{t('my_favorites')}</h2>
            </div>
            <div className="bg-gray-50 dark:bg-dark-800 px-6 py-3 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
               <span className="text-xs font-bold uppercase tracking-widest text-brown-900 dark:text-gold">{t('products_count').replace('{count}', favorites.length.toString())}</span>
            </div>
        </div>

        {/* Smart Actions */}
        <div className="mb-20">
            <div className="flex items-center gap-3 mb-8 ml-1">
                <span className="material-icons-outlined text-gold text-2xl">auto_awesome</span>
                <p className="text-[11px] font-bold font-sans text-gray-400 uppercase tracking-[0.4em]">{t('quick_pick')}</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <button onClick={() => handleSmartAction('cheapest')} className="p-8 bg-gray-50 dark:bg-dark-800 rounded-[40px] flex flex-col items-center justify-center gap-4 hover:bg-white dark:hover:bg-dark-700 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm hover:shadow-luxurious">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-dark-900 shadow-sm group-hover:scale-110 transition-transform group-hover:rotate-6">
                      <span className="material-icons-outlined text-blue-500 text-3xl">savings</span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">{t('smart_cheapest')}</span>
                </button>
                <button onClick={() => handleSmartAction('expensive')} className="p-8 bg-gray-50 dark:bg-dark-800 rounded-[40px] flex flex-col items-center justify-center gap-4 hover:bg-white dark:hover:bg-dark-700 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm hover:shadow-luxurious">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-dark-900 shadow-sm group-hover:scale-110 transition-transform group-hover:rotate-6">
                      <span className="material-icons-outlined text-purple-500 text-3xl">workspace_premium</span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">{t('smart_expensive')}</span>
                </button>
                <button onClick={() => handleSmartAction('aesthetic')} className="p-8 bg-gray-50 dark:bg-dark-800 rounded-[40px] flex flex-col items-center justify-center gap-4 hover:bg-white dark:hover:bg-dark-700 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm hover:shadow-luxurious">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-dark-900 shadow-sm group-hover:scale-110 transition-transform group-hover:rotate-6">
                      <span className="material-icons-outlined text-orange-500 text-3xl">auto_awesome</span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">{t('smart_surprise')}</span>
                </button>
                <button onClick={() => handleSmartAction('all')} className="p-8 bg-gray-50 dark:bg-dark-800 rounded-[40px] flex flex-col items-center justify-center gap-4 hover:bg-white dark:hover:bg-dark-700 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm hover:shadow-luxurious">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-dark-900 shadow-sm group-hover:scale-110 transition-transform group-hover:rotate-6">
                      <span className="material-icons-outlined text-teal-500 text-3xl">all_inclusive</span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">{t('smart_all')}</span>
                </button>
                {/* Featured Curated Action */}
                <button 
                    onClick={() => handleSmartAction('curated')}
                    className="col-span-2 lg:col-span-1 p-8 bg-brown-900 dark:bg-white rounded-[40px] shadow-2xl group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-black/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
                    <div className="flex flex-col items-center justify-center gap-4 relative z-10 text-center">
                        <div className="w-14 h-14 bg-white/20 dark:bg-black/10 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:rotate-12 transition-transform">
                            <span className="material-icons-outlined text-white dark:text-black text-3xl">inventory_2</span>
                        </div>
                        <div>
                          <span className="block font-display font-bold text-lg text-white dark:text-black italic leading-none">{t('smart_curated')}</span>
                          <span className="font-sans text-[9px] text-white/60 dark:text-black/50 uppercase tracking-[0.3em] mt-2 block">{t('create_custom_box')}</span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {favoriteProducts.map(product => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    viewMode={ViewMode.GRID} 
                    onQuickView={setQuickViewProduct}
                />
            ))}
        </div>

        <QuickViewModal 
            product={quickViewProduct} 
            isOpen={!!quickViewProduct} 
            onClose={() => setQuickViewProduct(null)} 
        />
    </main>
  );
};