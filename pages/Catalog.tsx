import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { useProducts } from '../context/ProductContext';
import { ViewMode, Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const Catalog: React.FC = () => {
  const { products: contextProducts } = useProducts();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [visibleCount, setVisibleCount] = useState(6);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sortOption, setSortOption] = useState<string>('default');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 300) setShowScrollTop(true);
        else setShowScrollTop(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    } else {
      setSearchTerm('');
    }
  };

  const processedProducts = useMemo(() => {
    let prods = [...contextProducts];

    // Akıllı Arama Mantığı: Başlık, açıklama ve içindekiler
    if (searchTerm.trim()) {
      const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
      prods = prods.filter(p => {
        const searchableText = `${p.title} ${p.description} ${p.ingredients || ''} ${p.category} ${p.tags?.join(' ') || ''}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    if (selectedTag !== 'all') {
      prods = prods.filter(p => p.tags?.includes(selectedTag));
    }

    if (sortOption === 'price-asc') prods.sort((a, b) => a.price - b.price);
    else if (sortOption === 'price-desc') prods.sort((a, b) => b.price - a.price);
    
    return prods;
  }, [contextProducts, sortOption, selectedTag, searchTerm]);

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedTag, sortOption, searchTerm]);

  const visibleProducts = processedProducts.slice(0, visibleCount);

  const getFilterButtonClass = (tag: string) => (
    selectedTag === tag 
      ? "shrink-0 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full text-xs font-bold uppercase tracking-wider"
      : "shrink-0 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap hover:bg-gray-50 transition-colors"
  );

  return (
    <main className="max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen relative">
      <div className="px-5 pt-8 pb-6">
        <div className="flex flex-col gap-5 mb-6">
            <div className="flex items-end justify-between">
                <div>
                  <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1 block">
                    {t('special_selection')}
                  </span>
                  <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {t('all_products')}
                  </h2>
                </div>
                
                <div className="flex bg-gray-100 dark:bg-dark-800 rounded-lg p-1">
                  <button onClick={() => setViewMode(ViewMode.GRID)} className={`p-2 rounded-md transition-all ${viewMode === ViewMode.GRID ? 'bg-white dark:bg-dark-900 shadow-sm text-brown-900 dark:text-white' : 'text-gray-400'}`}><span className="material-icons-outlined text-xl block">grid_view</span></button>
                  <button onClick={() => setViewMode(ViewMode.LIST_QTY)} className={`p-2 rounded-md transition-all ${viewMode === ViewMode.LIST_QTY ? 'bg-white dark:bg-dark-900 shadow-sm text-brown-900 dark:text-white' : 'text-gray-400'}`}><span className="material-icons-outlined text-xl block">view_list</span></button>
                </div>
            </div>

            <div className="flex items-center gap-3 h-10">
              {/* Minimalist Genişleyen Arama Çubuğu */}
              <div 
                className={`relative flex items-center transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) bg-gray-50 dark:bg-dark-800 rounded-full shadow-inner ${isSearchOpen ? 'flex-1 pr-4' : 'w-10 overflow-hidden'}`}
              >
                <button 
                  onClick={toggleSearch}
                  className={`w-10 h-10 flex items-center justify-center transition-colors shrink-0 ${isSearchOpen ? 'text-gold' : 'text-gray-400 hover:text-brown-900 dark:hover:text-white'}`}
                >
                  <span className="material-icons-outlined">{isSearchOpen ? 'close' : 'search'}</span>
                </button>
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ürün, içerik veya tat ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`bg-transparent border-none focus:ring-0 text-sm w-full transition-opacity duration-300 ${isSearchOpen ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>

              {!isSearchOpen && (
                <div className="relative inline-flex items-center flex-1 animate-fade-in h-10">
                    <span className="material-icons-outlined text-gray-400 absolute left-3 text-lg pointer-events-none">sort</span>
                    <select 
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="w-full pl-10 pr-8 h-full bg-gray-50 dark:bg-dark-800 border-none rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-brown-900 appearance-none cursor-pointer shadow-inner"
                    >
                        <option value="default">{t('sort_default')}</option>
                        <option value="price-asc">{t('sort_price_asc')}</option>
                        <option value="price-desc">{t('sort_price_desc')}</option>
                    </select>
                    <span className="material-icons-outlined text-gray-400 absolute right-3 text-sm pointer-events-none">expand_more</span>
                </div>
              )}
            </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar pb-2">
            {['all', 'tag_intense', 'tag_silky', 'tag_fruity', 'tag_nuts', 'tag_vegan'].map(tag => (
              <button key={tag} onClick={() => setSelectedTag(tag)} className={getFilterButtonClass(tag)}>{t(tag as any)}</button>
            ))}
        </div>
      </div>

      <div className={`${viewMode === ViewMode.GRID ? 'grid grid-cols-2 gap-4' : 'space-y-4'} px-4 animate-fade-in`}>
        {visibleProducts.length > 0 ? visibleProducts.map(product => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} onQuickView={setQuickViewProduct} />
        )) : (
            <div className="col-span-2 py-20 text-center opacity-50">
                <span className="material-icons-outlined text-4xl mb-2">search_off</span>
                <p className="text-sm uppercase tracking-widest">{t('no_products')}</p>
            </div>
        )}
      </div>

      <div className="mt-10 px-4 text-center">
        {visibleCount < processedProducts.length ? (
            <button onClick={() => setVisibleCount(v => v + 6)} className="font-sans text-sm font-bold uppercase tracking-widest text-brown-900 dark:text-gold border-b-2 border-gold pb-1 transition-all hover:scale-105 active:scale-95">
                {t('load_more')}
            </button>
        ) : (
            <span className="text-xs text-gray-400 uppercase tracking-widest">{processedProducts.length > 0 ? t('all_viewed') : ''}</span>
        )}
      </div>

      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className={`fixed bottom-24 right-5 z-40 bg-white dark:bg-dark-800 text-brown-900 dark:text-white p-3 rounded-full shadow-luxurious border border-gray-100 dark:border-gray-700 transition-all ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <span className="material-icons-outlined block">arrow_upward</span>
      </button>

      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </main>
  );
};