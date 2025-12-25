import React, { useState, useMemo } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';
import { ViewMode, Product } from '../types';
import { QuickViewModal } from '../components/QuickViewModal';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SlidersHorizontal, LayoutGrid, Rows3, XCircle } from 'lucide-react';

export const Catalog: React.FC = () => {
  const { products, isLoading } = useProducts();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<string>('default');
  const { t } = useLanguage();
  const location = useLocation();

  const searchTerm = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search')?.toLowerCase() || '';
  }, [location.search]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach(p => p.categories?.forEach(cat => uniqueCategories.add(cat)));
    return ['all', ...Array.from(uniqueCategories)];
  }, [products]);

  const hasActiveFilters = useMemo(() => {
    return selectedCategory !== 'all' || minPrice !== '' || maxPrice !== '' || sortOrder !== 'default';
  }, [selectedCategory, minPrice, maxPrice, sortOrder]);

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

    // Sıralama mantığı
    switch (sortOrder) {
      case 'price_asc':
        currentProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        currentProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // 'createdAt' gibi bir zaman damgası varsayarak sıralama
        // Product tipinde 'createdAt' özelliği yoksa bu kısım çalışmaz
        // ve varsayılan sıralama kullanılır.
        currentProducts.sort((a, b) => (new Date(b.createdAt || 0)).getTime() - (new Date(a.createdAt || 0)).getTime());
        break;
      case 'popular':
        // 'popularity' gibi bir özellik varsayarak sıralama
        // Product tipinde 'popularity' özelliği yoksa bu kısım çalışmaz
        // ve varsayılan sıralama kullanılır.
        currentProducts.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      default:
        // Varsayılan sıralama (ürünlerin orijinal sırası veya başka bir mantık)
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
          <div className="text-center mb-12">
            <h1 className="text-5xl font-display text-mocha-900 dark:text-white">{t('catalog_title')}</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 font-serif italic">{t('catalog_subtitle')}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-mocha-900 dark:hover:text-gold transition-colors">
              <SlidersHorizontal size={18} />
              <span>{t('filters')}</span>
            </button>
            {/* Kategori Filtresi */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {t(category === 'all' ? 'all_categories' : `category_${category.toLowerCase()}`) || category}
                </option>
              ))}
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
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode(ViewMode.GRID)} className={`p-2 rounded-md ${viewMode === ViewMode.GRID ? 'bg-gray-200 dark:bg-dark-700 text-mocha-900 dark:text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}>
              <LayoutGrid size={20} />
            </button>
            <button onClick={() => setViewMode(ViewMode.LIST)} className={`p-2 rounded-md ${viewMode === ViewMode.LIST ? 'bg-gray-200 dark:bg-dark-700 text-mocha-900 dark:text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}`}>
              <Rows3 size={20} />
            </button>
          </div>
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