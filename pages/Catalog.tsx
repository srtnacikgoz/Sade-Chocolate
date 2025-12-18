import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { useProducts } from '../context/ProductContext';
import { ViewMode, Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const Catalog: React.FC = () => {
  const { products: contextProducts } = useProducts();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [visibleCount, setVisibleCount] = useState(8);
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

    if (searchTerm.trim()) {
      const terms = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
      prods = prods.filter(p => {
        const searchable = `${p.title} ${p.description} ${p.category} ${p.ingredients || ''} ${p.tags?.join(' ') || ''}`.toLowerCase();
        return terms.every(term => searchable.includes(term));
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
    setVisibleCount(viewMode === ViewMode.GRID ? 8 : 6);
  }, [selectedTag, sortOption, searchTerm, viewMode]);

  const visibleProducts = processedProducts.slice(0, visibleCount);

  const filterTags = ['all', 'tag_intense', 'tag_silky', 'tag_fruity', 'tag_nuts', 'tag_vegan'];

  return (
    <main className="max-w-7xl mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen pt-20 lg:pt-28">
      
      {/* Catalog Header & Controls */}
      <div className="px-5 lg:px-8 mb-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-8">
            <div className="animate-fade-in">
              <span className="font-sans text-[10px] lg:text-xs font-bold tracking-[0.3em] text-gold uppercase mb-2 block">
                {t('special_selection')}
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100">
                {t('all_products')}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Dynamic Search Bar */}
              <div 
                className={`relative flex items-center transition-all duration-500 ease-in-out bg-gray-50 dark:bg-dark-800 rounded-full shadow-inner border border-gray-100 dark:border-gray-700 h-12 ${isSearchOpen ? 'w-full lg:w-72 pr-4' : 'w-12 overflow-hidden'}`}
              >
                <button 
                  onClick={toggleSearch}
                  className={`w-12 h-12 flex items-center justify-center transition-colors shrink-0 ${isSearchOpen ? 'text-gold' : 'text-gray-400 hover:text-brown-900 dark:hover:text-white'}`}
                >
                  <span className="material-icons-outlined text-2xl">{isSearchOpen ? 'close' : 'search'}</span>
                </button>
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Koleksiyonumuzda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`bg-transparent border-none focus:ring-0 text-sm w-full transition-opacity duration-300 ${isSearchOpen ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>

              {/* View Switches & Sort */}
              <div className="flex bg-gray-50 dark:bg-dark-800 rounded-full p-1 border border-gray-100 dark:border-gray-700 h-12">
                <button onClick={() => setViewMode(ViewMode.GRID)} className={`w-10 flex items-center justify-center rounded-full transition-all ${viewMode === ViewMode.GRID ? 'bg-white dark:bg-dark-900 shadow-sm text-gold' : 'text-gray-400'}`}><span className="material-icons-outlined">grid_view</span></button>
                <button onClick={() => setViewMode(ViewMode.LIST_QTY)} className={`w-10 flex items-center justify-center rounded-full transition-all ${viewMode === ViewMode.LIST_QTY ? 'bg-white dark:bg-dark-900 shadow-sm text-gold' : 'text-gray-400'}`}><span className="material-icons-outlined">view_list</span></button>
              </div>

              <div className="relative inline-flex items-center h-12 bg-gray-50 dark:bg-dark-800 rounded-full px-5 border border-gray-100 dark:border-gray-700 group min-w-[180px]">
                  <span className="material-icons-outlined text-gray-400 mr-2 text-xl">sort</span>
                  <select 
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="bg-transparent border-none rounded-full text-[11px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200 focus:ring-0 appearance-none cursor-pointer flex-1"
                  >
                      <option value="default">{t('sort_default')}</option>
                      <option value="price-asc">{t('sort_price_asc')}</option>
                      <option value="price-desc">{t('sort_price_desc')}</option>
                  </select>
                  <span className="material-icons-outlined text-gray-400 text-sm ml-1">expand_more</span>
              </div>
            </div>
        </div>

        {/* Filter Tags */}
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-2">
            {filterTags.map(tag => (
              <button 
                key={tag} 
                onClick={() => setSelectedTag(tag)} 
                className={`shrink-0 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 border ${
                  selectedTag === tag 
                    ? "bg-brown-900 text-white border-transparent shadow-lg dark:bg-gold dark:text-black" 
                    : "bg-white dark:bg-dark-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:bg-gray-50"
                }`}
              >
                {t(tag as any)}
              </button>
            ))}
        </div>
      </div>

      {/* Grid Yapısı: Mobilde 2, Masaüstünde 4 */}
      <div className={`px-5 lg:px-8 animate-fade-in ${viewMode === ViewMode.GRID ? 'grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8' : 'flex flex-col space-y-4 max-w-3xl mx-auto'}`}>
        {visibleProducts.length > 0 ? (
          visibleProducts.map(product => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} onQuickView={setQuickViewProduct} />
          ))
        ) : (
          <div className="col-span-full py-32 text-center animate-fade-in">
            <div className="w-24 h-24 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
               <span className="material-icons-outlined text-5xl">search_off</span>
            </div>
            <h3 className="font-display text-2xl text-gray-900 dark:text-white mb-2 italic">Damağınızla Eşleşen Bir Lezzet Bulamadık</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">Arama terimlerinizi gözden geçirmeyi veya diğer koleksiyonlarımıza göz atmayı deneyebilirsiniz.</p>
            <button onClick={() => {setSearchTerm(''); setSelectedTag('all');}} className="mt-8 text-gold font-bold uppercase tracking-widest text-[10px] border-b border-gold pb-1 hover:opacity-80 transition-opacity">Tüm Ürünleri Göster</button>
          </div>
        )}
      </div>

      {/* Load More */}
      <div className="mt-16 px-4 text-center">
        {visibleCount < processedProducts.length ? (
            <button 
              onClick={() => setVisibleCount(v => v + 8)} 
              className="px-10 py-4 bg-gray-50 dark:bg-dark-800 text-brown-900 dark:text-gold text-[11px] font-bold uppercase tracking-[0.3em] rounded-full border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all active:scale-95"
            >
                {t('load_more')}
            </button>
        ) : processedProducts.length > 0 ? (
            <div className="flex flex-col items-center">
               <div className="h-px w-24 bg-gray-100 dark:bg-gray-800 mb-4"></div>
               <span className="text-[10px] text-gray-400 uppercase tracking-widest italic">{t('all_viewed')}</span>
            </div>
        ) : null}
      </div>

      {/* Scroll Top */}
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className={`fixed bottom-24 right-5 lg:right-10 z-40 bg-white dark:bg-dark-800 text-brown-900 dark:text-white p-4 rounded-full shadow-luxurious border border-gray-100 dark:border-gray-800 transition-all hover:scale-110 active:scale-90 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <span className="material-icons-outlined block">arrow_upward</span>
      </button>

      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </main>
  );
};