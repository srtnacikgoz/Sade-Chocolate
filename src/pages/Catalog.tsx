import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';
import { ViewMode, Product } from '../types';
import { QuickViewModal } from '../components/QuickViewModal';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SlidersHorizontal, LayoutGrid, Rows3, XCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Catalog: React.FC = () => {
  const { products, isLoading } = useProducts();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

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
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-mocha-900 dark:hover:text-gold transition-colors"
            >
              <SlidersHorizontal size={18} />
              <span>{t('filters')}</span>
              <motion.div
                animate={{ rotate: isFiltersOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={18} />
              </motion.div>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode(ViewMode.GRID)} className={`p-2 rounded-md ${viewMode === ViewMode.GRID ? 'bg-gray-200 dark:bg-dark-700 text-mocha-900 dark:text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}>
                <LayoutGrid size={20} />
              </button>
              <button onClick={() => setViewMode(ViewMode.LIST)} className={`p-2 rounded-md ${viewMode === ViewMode.LIST ? 'bg-gray-200 dark:bg-dark-700 text-mocha-900 dark:text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}>
                <Rows3 size={20} />
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
                <div className="flex items-center gap-4 flex-wrap pt-4">
                  {/* Kategori Filtresi */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200"
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
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 w-28"
                  />
                  <input
                    type="number"
                    placeholder={t('max_price') || "Max Fiyat"}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 w-28"
                  />
                  {/* Sıralama Seçenekleri */}
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200"
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
                      className="flex items-center gap-1 px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                    >
                      <XCircle size={16} />
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
    </div>
  );
};