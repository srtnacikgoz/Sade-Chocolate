import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';
import { ViewMode, Product, BoxConfig } from '../types';
import { QuickViewModal } from '../components/QuickViewModal';
import { CuratedBoxModal } from '../components/CuratedBoxModal';
import { Footer } from '../components/Footer';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SlidersHorizontal, LayoutGrid, Rows3, XCircle, ChevronDown, Package, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Catalog: React.FC = () => {
  const { products, isLoading } = useProducts();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [boxConfig, setBoxConfig] = useState<BoxConfig | null>(null);
  const { t } = useLanguage();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Firestore'dan box_config yapılandırmasını çek
  useEffect(() => {
    const fetchBoxConfig = async () => {
      try {
        const docRef = doc(db, 'box_config', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBoxConfig(docSnap.data() as BoxConfig);
        }
      } catch (error) {
        console.error('Box config yüklenemedi:', error);
      }
    };
    fetchBoxConfig();
  }, []);

  // URL parametrelerinden state'leri başlat
  const initialCategory = searchParams.get('category') || 'all';
  const initialMinPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice') as string) : '';
  const initialMaxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice') as string) : '';
  const initialSortOrder = searchParams.get('sort') || 'default';
  const initialSearchTerm = searchParams.get('search')?.toLowerCase() || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [minPrice, setMinPrice] = useState<number | ''>(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState<number | ''>(initialMaxPrice);
  const [sortOrder, setSortOrder] = useState<string>(initialSortOrder);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);

  const categories = useMemo(() => {
    if (isLoading) return [];
    const uniqueCategories = new Set<string>();
    products.forEach(p => p.categories?.forEach(cat => uniqueCategories.add(cat)));
    return ['all', ...Array.from(uniqueCategories)];
  }, [products, isLoading]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setMinPrice(searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice') as string) : '');
    setMaxPrice(searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice') as string) : '');
    setSortOrder(searchParams.get('sort') || 'default');
    setSearchTerm(searchParams.get('search')?.toLowerCase() || '');
  }, [searchParams]);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (searchTerm) newSearchParams.set('search', searchTerm);
    if (selectedCategory !== 'all') newSearchParams.set('category', selectedCategory);
    if (minPrice !== '') newSearchParams.set('minPrice', minPrice.toString());
    if (maxPrice !== '') newSearchParams.set('maxPrice', maxPrice.toString());
    if (sortOrder !== 'default') newSearchParams.set('sort', sortOrder);
    setSearchParams(newSearchParams, { replace: true });
  }, [selectedCategory, minPrice, maxPrice, sortOrder, searchTerm, setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    return selectedCategory !== 'all' || minPrice !== '' || maxPrice !== '' || sortOrder !== 'default' || searchTerm !== initialSearchTerm;
  }, [selectedCategory, minPrice, maxPrice, sortOrder, searchTerm, initialSearchTerm]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('default');
  };

  const sortedAndFilteredProducts = useMemo(() => {
    let currentProducts = products;

    // 👁️ Katalogda gizli ürünleri filtrele
    currentProducts = currentProducts.filter(p => p.isVisibleInCatalog !== false);

    if (searchTerm) {
      currentProducts = currentProducts.filter(p =>
        p.title.toLowerCase().includes(searchTerm) ||
        p.attributes?.some(a => a.toLowerCase().includes(searchTerm))
      );
    }

    if (selectedCategory !== 'all') {
      currentProducts = currentProducts.filter(p =>
        p.categories?.includes(selectedCategory)
      );
    }

    if (minPrice !== '') {
      currentProducts = currentProducts.filter(p => p.price >= minPrice);
    }

    if (maxPrice !== '') {
      currentProducts = currentProducts.filter(p => p.price <= maxPrice);
    }

    switch (sortOrder) {
      case 'price_asc':
        currentProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        currentProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        currentProducts.sort((a, b) => (new Date(b.createdAt || 0)).getTime() - (new Date(a.createdAt || 0)).getTime());
        break;
      case 'popular':
        currentProducts.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      default:
        break;
    }

    return currentProducts;
  }, [searchTerm, products, selectedCategory, minPrice, maxPrice, sortOrder]);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const closeQuickView = () => {
    setSelectedProduct(null);
  };

  const SearchHeader = () => (
    <div className="text-center py-8 bg-cream-100 dark:bg-dark-900 rounded-lg mb-8">
      <h2 className="text-xl font-serif italic text-gray-500">{t('search_results_for')}</h2>
      <p className="text-4xl font-display text-mocha-900 dark:text-white">"{searchTerm}"</p>
      <p className="text-sm text-gray-400 mt-2">{sortedAndFilteredProducts.length} {t('products_found')}</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-28 transition-all duration-300">
              <div className="pt-16">
              {searchTerm ? <SearchHeader /> : (
                <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-10">
                  <div>
                    <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-3 block">Size Özel Seçimler</span>
                    <h2 className="font-display text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white italic tracking-tighter">{t('catalog_title')}</h2>
                  </div>
                </div>
              )}
      
              <div className="mb-6">          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-800 dark:to-dark-900 border border-gray-200 dark:border-gray-700 hover:border-gold dark:hover:border-gold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <SlidersHorizontal size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors duration-300" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gold transition-colors duration-300">{t('filters')}</span>
              <motion.div
                animate={{ rotate: isFiltersOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors duration-300" />
              </motion.div>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(ViewMode.GRID)}
                className={`group p-3.5 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                  viewMode === ViewMode.GRID
                    ? 'bg-gradient-to-br from-gold to-brand-mustard border-2 border-gold shadow-md'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-800 dark:to-dark-900 border border-gray-200 dark:border-gray-700 hover:border-gold dark:hover:border-gold'
                }`}
              >
                <LayoutGrid size={20} className={viewMode === ViewMode.GRID ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors duration-300'} />
              </button>
              <button
                onClick={() => setViewMode(ViewMode.LIST)}
                className={`group p-3.5 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                  viewMode === ViewMode.LIST
                    ? 'bg-gradient-to-br from-gold to-brand-mustard border-2 border-gold shadow-md'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-800 dark:to-dark-900 border border-gray-200 dark:border-gray-700 hover:border-gold dark:hover:border-gold'
                }`}
              >
                <Rows3 size={20} className={viewMode === ViewMode.LIST ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors duration-300'} />
              </button>
            </div>
          </div>
          <AnimatePresence>
            {isFiltersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-4 flex-wrap pt-6">
                  {/* Kategori Filtresi */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 hover:border-gold dark:hover:border-gold focus:border-gold dark:focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <option>{t('loading_categories') || "Yükleniyor..."}</option>
                    ) : (
                      categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? t('all_categories') : category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))
                    )}
                  </select>
                  {/* Fiyat Aralığı Filtresi */}
                  <input
                    type="number"
                    placeholder={t('min_price') || "Min Fiyat"}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 hover:border-gold dark:hover:border-gold focus:border-gold dark:focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all w-32"
                  />
                  <input
                    type="number"
                    placeholder={t('max_price') || "Max Fiyat"}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 hover:border-gold dark:hover:border-gold focus:border-gold dark:focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all w-32"
                  />
                  {/* Sıralama Seçenekleri */}
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 hover:border-gold dark:hover:border-gold focus:border-gold dark:focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all cursor-pointer"
                  >
                    <option value="default">{t('sort_default') || "Varsayılan"}</option>
                    <option value="price_asc">{t('sort_price_asc') || "Fiyat: Artan"}</option>
                    <option value="price_desc">{t('sort_price_desc') || "Fiyat: Azalan"}</option>
                    <option value="newest">{t('sort_newest') || "En Yeniler"}</option>
                    <option value="popular">{t('sort_popular') || "En Popülerler"}</option>
                  </select>
                  {/* Filtreleri Temizle Butonu */}
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 hover:border-red-400 dark:hover:border-red-500 text-sm font-bold text-red-700 dark:text-red-400 hover:scale-105 transition-all duration-300 hover:shadow-lg"
                    >
                      <XCircle size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                      <span>{t('clear_filters') || "Temizle"}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-t-transparent border-mocha-900 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500">{t('loading_products')}</p>
          </div>
        ) : (
          <div className={`grid gap-x-6 gap-y-10 transition-all duration-500 ${viewMode === ViewMode.GRID ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {/* Kendi Kutunu Oluştur - ProductCard Stili */}
            {(boxConfig?.enabled !== false) && (
              <motion.div
                onClick={() => setIsBoxModalOpen(true)}
                className={`group bg-cream-50 dark:bg-dark-800 rounded-xl shadow-luxurious hover:shadow-hover transition-all duration-500 overflow-hidden flex flex-col h-full border border-gold/15 relative cursor-pointer text-left ${
                  viewMode === ViewMode.LIST ? 'flex-row' : ''
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Görsel Alanı - ProductCard ile aynı */}
                <div className={`relative ${viewMode === ViewMode.LIST ? 'w-48 aspect-square' : 'aspect-[4/5]'} bg-[#F9F9F9] dark:bg-gray-800 overflow-hidden`}>
                  {/* Rozet */}
                  <span className="absolute top-0 left-0 text-[10px] font-bold px-3 py-1 uppercase tracking-widest z-20 bg-gold text-white">
                    Özel
                  </span>

                  {/* Görsel veya Varsayılan İkon */}
                  {boxConfig?.cardImage ? (
                    <img
                      src={boxConfig.cardImage}
                      alt={boxConfig?.cardTitle || 'Kendi Kutunu Oluştur'}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-all duration-300 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-brand-mustard/20">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-gold to-brand-mustard rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                          <Package className="text-white" size={48} />
                        </div>
                        <Sparkles className="absolute -top-2 -right-2 text-gold drop-shadow-md" size={20} />
                      </div>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-mocha-900/0 group-hover:bg-mocha-900/5 transition-colors duration-700" />
                </div>

                {/* Alt Bilgiler - ProductCard ile aynı */}
                <div className={`p-4 flex flex-col flex-grow relative z-20 bg-cream-50 dark:bg-dark-800 ${viewMode === ViewMode.LIST ? 'justify-center' : ''}`}>
                  <h3 className="font-display text-lg font-semibold leading-tight mb-1 text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[3rem]">
                    {boxConfig?.cardTitle || 'Kendi Kutunu Oluştur'}
                  </h3>
                  <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                    {boxConfig?.cardSubtitle || 'Favori bonbonlarını seç'}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    {/* Kutu boyutları */}
                    <div className="flex items-center gap-1 text-[9px] font-bold text-gold uppercase tracking-wider">
                      {boxConfig?.boxSizes?.filter(s => s.enabled).slice(0, 3).map((size, idx, arr) => (
                        <React.Fragment key={size.id}>
                          <span>{size.size}'li</span>
                          {idx < arr.length - 1 && <span className="text-gold/40">•</span>}
                        </React.Fragment>
                      )) || (
                        <>
                          <span>4'lü</span>
                          <span className="text-gold/40">•</span>
                          <span>8'li</span>
                          <span className="text-gold/40">•</span>
                          <span>16'lı</span>
                        </>
                      )}
                    </div>
                    {/* Sepete ekle yerine + butonu */}
                    <div className="bg-gold text-white w-9 h-9 flex items-center justify-center rounded-full group-hover:bg-gray-900 dark:group-hover:bg-gray-900 transition-colors duration-300 shadow-sm">
                      <span className="material-icons-outlined text-lg">add</span>
                    </div>
                  </div>

                  {/* Geniş buton - ProductCard ile aynı */}
                  <button className="w-full mt-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-mocha-900 dark:text-gray-100 border border-gold/20 bg-cream-50 dark:bg-transparent rounded-lg hover:bg-gold hover:text-white dark:hover:bg-gold transition-all duration-300 shadow-sm">
                    {boxConfig?.ctaText || 'Kutuya Git'}
                  </button>
                </div>
              </motion.div>
            )}

            {sortedAndFilteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={closeQuickView}
        />
      )}

      {/* Kendi Kutunu Oluştur Modal */}
      <CuratedBoxModal
        isOpen={isBoxModalOpen}
        onClose={() => setIsBoxModalOpen(false)}
      />

      <Footer />
    </div>
  );
};