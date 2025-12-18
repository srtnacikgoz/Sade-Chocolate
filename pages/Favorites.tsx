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
            return {
                ...productData,
                id: favId 
            };
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
        <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-5 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-24 h-24 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mb-6">
                <span className="material-icons-outlined text-4xl text-gray-400 dark:text-gray-500">favorite_border</span>
            </div>
            <h2 className="font-display text-2xl text-gray-900 dark:text-white mb-2">{t('favorites_empty_title')}</h2>
            <p className="font-sans text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
                {t('favorites_empty_desc')}
            </p>
            <Link 
                to="/catalog"
                className="px-8 py-4 bg-brown-900 text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest text-xs rounded shadow-lg hover:bg-opacity-90 transition-opacity"
            >
                {t('discover_products')}
            </Link>
        </main>
    );
  }

  return (
    <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen relative">
        <div className="px-5 mb-6 flex items-center justify-between">
            <h2 className="font-display text-3xl font-medium text-gray-900 dark:text-white">{t('my_favorites')}</h2>
            <span className="text-sm font-sans text-gray-500 dark:text-gray-400">{t('products_count').replace('{count}', favorites.length.toString())}</span>
        </div>

        {/* Smart Actions */}
        <div className="px-4 mb-8">
            <p className="text-xs font-sans text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t('quick_pick')}</p>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
                <button 
                    onClick={() => handleSmartAction('cheapest')}
                    className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-gold/10 hover:text-brown-900 transition-colors group border border-transparent hover:border-gold/20"
                >
                    <span className="material-icons-outlined text-xl text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">savings</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">{t('smart_cheapest')}</span>
                </button>
                <button 
                    onClick={() => handleSmartAction('expensive')}
                    className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-gold/10 hover:text-brown-900 transition-colors group border border-transparent hover:border-gold/20"
                >
                    <span className="material-icons-outlined text-xl text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">workspace_premium</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">{t('smart_expensive')}</span>
                </button>
                <button 
                    onClick={() => handleSmartAction('aesthetic')}
                    className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-gold/10 hover:text-brown-900 transition-colors group border border-transparent hover:border-gold/20"
                >
                    <span className="material-icons-outlined text-xl text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">auto_awesome</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">{t('smart_surprise')}</span>
                </button>
                <button 
                    onClick={() => handleSmartAction('all')}
                    className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-gold/10 hover:text-brown-900 transition-colors group border border-transparent hover:border-gold/20"
                >
                    <span className="material-icons-outlined text-xl text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">all_inclusive</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 group-hover:text-brown-900 dark:group-hover:text-gold">{t('smart_all')}</span>
                </button>
            </div>

            {/* Curated Box Button - New Featured Action */}
            <button 
                onClick={() => handleSmartAction('curated')}
                className="w-full p-4 bg-gradient-to-r from-brown-900 to-brown-800 dark:from-white dark:to-gray-200 rounded-xl shadow-lg group relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/20 transition-colors"></div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col items-start">
                        <span className="font-display font-bold text-lg text-white dark:text-black">{t('smart_curated')}</span>
                        <span className="font-sans text-[10px] text-white/80 dark:text-black/70 uppercase tracking-wider">{t('create_custom_box')}</span>
                    </div>
                    <div className="w-10 h-10 bg-white/20 dark:bg-black/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <span className="material-icons-outlined text-white dark:text-black">inventory_2</span>
                    </div>
                </div>
            </button>

        </div>
        
        <div className="grid grid-cols-2 gap-4 px-4 animate-fade-in">
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