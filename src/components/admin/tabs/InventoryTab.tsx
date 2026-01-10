import React, { useState, useMemo } from 'react';
import { Product } from '../../../types';
import { PRODUCT_CATEGORIES } from '../../../constants';
import { Package, AlertTriangle, LayoutGrid, TrendingUp, Search, Plus, Minus, Edit3, Trash2, Eye, EyeOff, Layers } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { toast } from 'sonner';

interface InventoryTabProps {
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setEditingProduct: (product: Product | null) => void;
  setIsFormOpen: (open: boolean) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  updateProduct,
  deleteProduct,
  setEditingProduct,
  setIsFormOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Dinamik kategori listesi: Varsayılan kategoriler + ürünlerdeki benzersiz kategoriler
  const dynamicCategories = useMemo(() => {
    // Ürünlerdeki tüm benzersiz kategorileri al
    const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

    // Varsayılan kategorilerden başla
    const allCategories = [...PRODUCT_CATEGORIES];

    // Ürünlerde olup varsayılanlarda olmayan kategorileri ekle
    productCategories.forEach(cat => {
      if (!allCategories.find(c => c.id === cat)) {
        // Kategori adını capitalize et
        const label = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');
        allCategories.push({ id: cat, label });
      }
    });

    return allCategories;
  }, [products]);
  const [criticalStockThreshold, setCriticalStockThreshold] = useState(() => {
    const saved = localStorage.getItem('criticalStockThreshold');
    return saved ? parseInt(saved, 10) : 5;
  });

  const handleCriticalThresholdChange = (value: number) => {
    const newValue = Math.max(0, value);
    setCriticalStockThreshold(newValue);
    localStorage.setItem('criticalStockThreshold', String(newValue));
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };

  const handleStockUpdate = async (id: string, currentStock: number, delta: number) => {
    try {
      await updateProduct(id, { locationStock: { yesilbahce: Math.max(0, currentStock + delta) } });
    } catch (err) {
      toast.error("Stok güncellenemedi.");
    }
  };

  const handleVisibilityToggle = async (productId: string, currentVisibility: boolean | undefined) => {
    try {
      // Varsayılan değer true (görünür), toggle edince tersine çevir
      const newVisibility = currentVisibility === false ? true : false;
      await updateProduct(productId, { isVisibleInCatalog: newVisibility });
      toast.success(newVisibility ? 'Ürün katalogda gösterilecek' : 'Ürün katalogdan gizlendi');
    } catch (err) {
      toast.error('Görünürlük güncellenemedi.');
    }
  };

  const handleStockStatusToggle = async (productId: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = !currentStatus;
      await updateProduct(productId, { isOutOfStock: newStatus });
      toast.success(newStatus ? 'Ürün tükendi olarak işaretlendi' : 'Ürün satışa açıldı');
    } catch (err) {
      toast.error('Stok durumu güncellenemedi.');
    }
  };

  const stats = useMemo(() => ({
    total: products.length,
    criticalStock: products.filter(p => (p.locationStock?.yesilbahce || 0) <= criticalStockThreshold).length,
    outOfStock: products.filter(p => (p.locationStock?.yesilbahce || 0) === 0).length,
    categories: [...new Set(products.map(p => p.category))].length,
    totalValue: products.reduce((acc, p) => acc + (p.price * (p.locationStock?.yesilbahce || 0)), 0)
  }), [products, criticalStockThreshold]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Dinamik kategori filtresi
    let matchesFilter = true;
    if (filterCategory !== 'all') {
      matchesFilter = p.category === filterCategory;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Bar (Kompakt inline) */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Ürün */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50">
          <div className="w-8 h-8 text-blue-600 bg-blue-50 rounded-lg flex items-center justify-center">
            <Package size={16} />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{stats.total}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">Ürün</span>
          </div>
        </div>

        {/* Kritik Stok - Düzenlenebilir */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${stats.criticalStock > 0 ? 'bg-red-50 ring-2 ring-red-200' : 'bg-slate-50'}`}>
          <div className="w-8 h-8 text-red-600 bg-red-50 rounded-lg flex items-center justify-center">
            <AlertTriangle size={16} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{stats.criticalStock}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase">Kritik</span>
            <span className="text-[9px] text-gray-300">|</span>
            <span className="text-[9px] text-gray-400">≤</span>
            <input
              type="number"
              value={criticalStockThreshold}
              onChange={(e) => handleCriticalThresholdChange(parseInt(e.target.value) || 0)}
              className="w-10 px-1.5 py-0.5 text-xs font-bold text-center border border-red-200 rounded-lg focus:ring-2 focus:ring-red-300 outline-none bg-white"
              min={0}
            />
            <span className="text-[9px] text-gray-400">adet</span>
          </div>
          {stats.criticalStock > 0 && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">!</span>}
        </div>

        {/* Stok Yok */}
        {stats.outOfStock > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 ring-2 ring-orange-200">
            <div className="w-8 h-8 text-orange-600 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package size={16} />
            </div>
            <div>
              <span className="text-lg font-bold text-orange-600">{stats.outOfStock}</span>
              <span className="text-[9px] text-orange-500 font-bold uppercase ml-1">Stok Yok</span>
            </div>
          </div>
        )}

        {/* Koleksiyon */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50">
          <div className="w-8 h-8 text-purple-600 bg-purple-50 rounded-lg flex items-center justify-center">
            <LayoutGrid size={16} />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{stats.categories}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">Koleksiyon</span>
          </div>
        </div>

        {/* Toplam Değer */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50">
          <div className="w-8 h-8 text-emerald-600 bg-emerald-50 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">₺{stats.totalValue.toLocaleString()}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">Toplam Değer</span>
          </div>
        </div>
      </div>

      {/* Ürün Listesi Tablosu */}
      <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col gap-4 bg-slate-50/30">
          {/* Dinamik Kategori Filtre Sistemi */}
          <div className="flex flex-wrap gap-2 bg-gradient-to-r from-slate-50 to-slate-100 p-2 rounded-2xl border border-slate-200">
            {/* Tümü Butonu */}
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-5 py-3 text-[10px] font-black rounded-xl transition-all flex items-center gap-2 ${
                filterCategory === 'all'
                  ? 'bg-white shadow-md text-brown-900 ring-2 ring-brown-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
              }`}
            >
              <Layers size={14} /> TÜMÜ
              <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full ml-1">
                {products.length}
              </span>
            </button>

            {/* Dinamik Kategori Butonları */}
            {dynamicCategories.map(cat => {
              const count = products.filter(p => p.category === cat.id).length;
              if (count === 0) return null; // Ürün yoksa gösterme

              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-5 py-3 text-[10px] font-black rounded-xl transition-all flex items-center gap-2 ${
                    filterCategory === cat.id
                      ? 'bg-white shadow-md text-brown-900 ring-2 ring-brown-100'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                  }`}
                >
                  {cat.label.toUpperCase()}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    filterCategory === cat.id ? 'bg-brown-100 text-brown-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Ürün Ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-brown-900/10 outline-none" />
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredProducts.map(product => (
            <div key={product.id} className="p-6 hover:bg-slate-50/50 flex items-center justify-between group transition-all">
              <div className="flex items-center gap-6">
                <div className="relative w-16 h-16 rounded-[24px] overflow-hidden border shadow-sm shrink-0 bg-slate-50 flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.title} />
                  ) : (
                    <Package size={24} className="text-slate-200" />
                  )}
                </div>
                <div>
                  <h4 className="font-display font-bold text-base italic text-gray-900 dark:text-white">{product.title}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-brown-900 dark:text-gold font-black bg-brown-50 dark:bg-brown-900/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
                      {dynamicCategories.find(cat => cat.id === product.category)?.label || product.category || 'Kategorisiz'}
                    </span>
                    <span className="text-sm font-mono font-bold text-gray-400 italic">₺{product.price.toFixed(2)}</span>
                    {(product.locationStock?.yesilbahce || 0) === 0 && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">STOK YOK</span>}
                    {(product.locationStock?.yesilbahce || 0) > 0 && (product.locationStock?.yesilbahce || 0) <= criticalStockThreshold && <span className="text-[8px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black">KRİTİK</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-14">
                {/* Stok Durumu Toggle */}
                <div className="hidden md:flex flex-col items-center gap-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Satış</span>
                  <button
                    onClick={() => handleStockStatusToggle(product.id, product.isOutOfStock)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      !product.isOutOfStock
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-500 hover:bg-red-100'
                    }`}
                    title={!product.isOutOfStock ? 'Satışta' : 'Tükendi'}
                  >
                    {!product.isOutOfStock ? (
                      <>
                        <span className="material-icons-outlined text-base">check_circle</span>
                        <span className="text-[10px] font-bold">Satışta</span>
                      </>
                    ) : (
                      <>
                        <span className="material-icons-outlined text-base">remove_shopping_cart</span>
                        <span className="text-[10px] font-bold">Tükendi</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Katalog Görünürlüğü Toggle */}
                <div className="hidden md:flex flex-col items-center gap-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Katalog</span>
                  <button
                    onClick={() => handleVisibilityToggle(product.id, product.isVisibleInCatalog)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      product.isVisibleInCatalog !== false
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={product.isVisibleInCatalog !== false ? 'Katalogda görünür' : 'Katalogdan gizli'}
                  >
                    {product.isVisibleInCatalog !== false ? (
                      <>
                        <Eye size={16} />
                        <span className="text-[10px] font-bold">Göster</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={16} />
                        <span className="text-[10px] font-bold">Gizli</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="hidden md:flex flex-col items-center gap-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Envanter</span>
                  <div className="flex items-center gap-5 bg-slate-50 dark:bg-dark-900 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                    <button onClick={() => handleStockUpdate(product.id, product.locationStock?.yesilbahce || 0, -1)} className="w-9 h-9 hover:bg-white dark:hover:bg-dark-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all active:scale-90"><Minus size={16} /></button>
                    <span className="text-xl font-display font-bold w-6 text-center text-gray-900 dark:text-white">{product.locationStock?.yesilbahce || 0}</span>
                    <button onClick={() => handleStockUpdate(product.id, product.locationStock?.yesilbahce || 0, 1)} className="w-9 h-9 hover:bg-white dark:hover:bg-dark-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-all active:scale-90"><Plus size={16} /></button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="p-4 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-[20px] transition-all"><Edit3 size={22} /></button>
                  <AlertDialog.Root>
                    <AlertDialog.Trigger asChild><button className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[20px] transition-all"><Trash2 size={22} /></button></AlertDialog.Trigger>
                    <AlertDialog.Portal>
                      <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] animate-in fade-in" />
                      <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-800 p-10 rounded-[48px] shadow-2xl z-[131] w-full max-w-md animate-in zoom-in-95">
                        <AlertDialog.Title className="text-2xl font-display font-bold mb-2 italic text-gray-900 dark:text-white">Ürünü Sil</AlertDialog.Title>
                        <AlertDialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">Bu ürünü koleksiyondan kalıcı olarak kaldırılacak. Emin misiniz?</AlertDialog.Description>
                        <div className="flex justify-end gap-3">
                          <AlertDialog.Cancel asChild><button className="px-8 py-4 text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-dark-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-dark-700">VAZGEÇ</button></AlertDialog.Cancel>
                          <AlertDialog.Action asChild><button onClick={() => deleteProduct(product.id)} className="px-8 py-4 text-[10px] font-black text-white bg-red-600 rounded-2xl shadow-lg hover:bg-red-700">SİL</button></AlertDialog.Action>
                        </div>
                      </AlertDialog.Content>
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
