import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { useProducts } from '../context/ProductContext';
import { ViewMode, Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const Catalog: React.FC = () => {
  const { products: allProducts } = useProducts();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [visibleCount, setVisibleCount] = useState(12);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sortOption, setSortOption] = useState<string>('default');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 300) setShowScrollTop(true);
        else setShowScrollTop(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const processedProducts = useMemo(() => {
    let prods = [...allProducts];

    // Search filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      prods = prods.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.tags && p.tags.some(tag => t(tag as any).toLowerCase().includes(term)))
      );
    }

    // Tag filter
    if (selectedTag !== 'all') {
      prods = prods.filter(p => p.tags?.includes(selectedTag));
    }

    // Sorting
    if (sortOption === 'price-asc') prods.sort((a, b) => a.price - b.price);
    else if (sortOption === 'price-desc') prods.sort((a, b) => b.price - a.price);
    
    return prods;
  }, [allProducts, searchQuery, sortOption, selectedTag, t]);

  useEffect(() => {
    setVisibleCount(viewMode === ViewMode.GRID ? 12 : 8);
  }, [selectedTag, sortOption, searchQuery, viewMode]);

  const visibleProducts = processedProducts.slice(0, visibleCount);

  const filterTags = ['all', 'tag_intense', 'tag_silky', 'tag_fruity', 'tag_nuts', 'tag_vegan'];

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen">
      
      {/* Catalog Header */}
      <div className="mb-10 animate-fade-in">
        <span className="font-sans text-[10px] lg:text-xs font-bold tracking-[0.4em] text-gold uppercase mb-3 block">
          {t('special_selection')}
        </span>
        <h2 className="font-display text-5xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 italic tracking-tighter mb-8">
          {t('all_products')}
        </h2>

        {/* Search Bar with Focus Animation */}
        <div className="relative mb-8 group">
          <span className="material-icons-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gold transition-colors duration-300">search</span>
          <input 
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-dark-800 border border-transparent focus:border-gold/30 rounded-[25px] text-sm focus:ring-4 focus:ring-gold/5 transition-all duration-300 outline-none dark:text-white"
          />
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
            {filterTags.map(tag => (
              <button 
                key={tag} 
                onClick={() => setSelectedTag(tag)} 
                className={`shrink-0 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${
                  selectedTag === tag 
                    ? "bg-brown-900 text-white border-transparent shadow-xl dark:bg-gold dark:text-black" 
                    : "bg-white dark:bg-dark-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:bg-gray-50"
                }`}
              >
                {t(tag as any)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-50 dark:bg-dark-800 rounded-full p-1 border border-gray-100 dark:border-gray-700 h-12 shadow-inner">
              <button onClick={() => setViewMode(ViewMode.GRID)} className={`w-10 flex items-center justify-center rounded-full transition-all ${viewMode === ViewMode.GRID ? 'bg-white dark:bg-dark-900 shadow-sm text-gold' : 'text-gray-400'}`}><span className="material-icons-outlined">grid_view</span></button>
              <button onClick={() => setViewMode(ViewMode.LIST_QTY)} className={`w-10 flex items-center justify-center rounded-full transition-all ${viewMode === ViewMode.LIST_QTY ? 'bg-white dark:bg-dark-900 shadow-sm text-gold' : 'text-gray-400'}`}><span className="material-icons-outlined">view_list</span></button>
            </div>

            <div className="relative inline-flex items-center h-12 bg-gray-50 dark:bg-dark-800 rounded-full px-5 border border-gray-100 dark:border-gray-700 shadow-inner group">
              <span className="material-icons-outlined text-gray-400 mr-2 text-xl group-hover:text-gold transition-colors">sort</span>
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200 focus:ring-0 appearance-none cursor-pointer pr-6"
              >
                <option value="default">{t('sort_default')}</option>
                <option value="price-asc">{t('sort_price_asc')}</option>
                <option value="price-desc">{t('sort_price_desc')}</option>
              </select>
              <span className="material-icons-outlined text-gray-400 text-sm absolute right-4 pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid - Responsive Columns (2 Mobile, 4 Desktop) */}
      {viewMode === ViewMode.GRID ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 animate-fade-in">
            {visibleProducts.length > 0 ? (
                visibleProducts.map(product => (
                    <ProductCard key={product.id} product={product} viewMode={ViewMode.GRID} onQuickView={setQuickViewProduct} />
                ))
            ) : (
                <div className="col-span-full py-40 text-center animate-fade-in">
                    <div className="w-32 h-32 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <span className="material-icons-outlined text-6xl text-gray-300">search_off</span>
                    </div>
                    <h3 className="font-display text-3xl text-gray-900 dark:text-white mb-4 italic leading-tight">{t('no_search_results')}</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Damağınızla eşleşen lezzetleri bulmak için farklı anahtar kelimeler deneyin.</p>
                </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col space-y-6 max-w-4xl mx-auto animate-fade-in">
            {visibleProducts.length > 0 ? (
                visibleProducts.map(product => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} onQuickView={setQuickViewProduct} />
                ))
            ) : (
                <div className="col-span-full py-40 text-center animate-fade-in">
                    <div className="w-32 h-32 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <span className="material-icons-outlined text-6xl text-gray-300">search_off</span>
                    </div>
                    <h3 className="font-display text-3xl text-gray-900 dark:text-white mb-4 italic leading-tight">{t('no_search_results')}</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Damağınızla eşleşen lezzetleri bulmak için farklı anahtar kelimeler deneyin.</p>
                </div>
            )}
        </div>
      )}

      {/* Load More */}
      {visibleCount < processedProducts.length && (
        <div className="mt-20 text-center">
          <button 
            onClick={() => setVisibleCount(v => v + 8)} 
            className="px-14 py-5 bg-brown-900 text-white dark:bg-gold dark:text-black text-[11px] font-bold uppercase tracking-[0.4em] rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95"
          >
            {t('load_more')}
          </button>
        </div>
      )}

      {/* Scroll Top */}
      <button 
        onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} 
        className={`fixed bottom-24 right-8 lg:right-12 z-40 bg-white dark:bg-dark-800 text-brown-900 dark:text-white w-14 h-14 rounded-full shadow-luxurious border border-gray-100 dark:border-gray-800 transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-0 pointer-events-none'}`}
      >
        <span className="material-icons-outlined">arrow_upward</span>
      </button>

      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </main>
  );
};