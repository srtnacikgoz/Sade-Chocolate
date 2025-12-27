import React, { useState, useMemo } from 'react';
import { Product } from '../../../types';
import { PRODUCT_CATEGORIES } from '../../../constants';
import { Package, AlertTriangle, LayoutGrid, TrendingUp, Search, Plus, Minus, Edit3, Trash2 } from 'lucide-react';
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
  const [activeCategory, setActiveCategory] = useState('Tümü');

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

  const stats = useMemo(() => ({
    total: products.length,
    outOfStock: products.filter(p => (p.locationStock?.yesilbahce || 0) === 0).length,
    categories: [...new Set(products.map(p => p.category))].length,
    totalValue: products.reduce((acc, p) => acc + (p.price * (p.locationStock?.yesilbahce || 0)), 0)
  }), [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Tümü' || p.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- LOJİSTİK STRATEJİSİ KUTUSU --- */}
      <div className="mb-8 p-8 bg-gold/5 rounded-[32px] border border-gold/15 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gold shadow-sm border border-gold/10">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold italic text-brown-900">Lojistik Stratejisi</h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Ücretsiz kargo için gereken minimum sepet tutarı</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gold/10 shadow-sm">
          <div className="flex items-center px-4 font-display font-bold text-brown-900">₺</div>
          <input
            type="number"
            defaultValue={1500}
            className="w-24 p-2 font-display font-bold text-lg outline-none bg-transparent"
          />
          <button
            className="bg-brown-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-all shadow-md active:scale-95"
            onClick={() => toast.success('Kargo limiti güncellendi! (Simülasyon)')}
          >
            GÜNCELLE
          </button>
        </div>
      </div>
      {/* --- LOJİSTİK STRATEJİSİ KUTUSU BİTTİ --- */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Ürün Sayısı', val: stats.total, icon: Package, color: 'blue' },
          { label: 'Stok Kritik', val: stats.outOfStock, icon: AlertTriangle, color: 'red', critical: stats.outOfStock > 0 },
          { label: 'Koleksiyonlar', val: stats.categories, icon: LayoutGrid, color: 'purple' },
          { label: 'Tahmini Değer', val: `₺${stats.totalValue.toLocaleString()}`, icon: TrendingUp, color: 'emerald' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-dark-800 p-7 rounded-[32px] border border-gray-200 shadow-sm relative overflow-hidden group">
            {item.critical && <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse z-10">ACİL</div>}
            <div className={`w-12 h-12 ${colorMap[item.color]} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <div className="text-3xl font-display font-bold leading-none text-gray-900 dark:text-white">{item.val}</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Ürün Listesi Tablosu */}
      <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl">
            {['Tümü', ...PRODUCT_CATEGORIES.map(cat => cat.id)].map(c => (
              <button key={c} onClick={() => setActiveCategory(c)} className={`px-7 py-2.5 text-[10px] font-black rounded-xl transition-all ${activeCategory === c ? 'bg-white shadow-md text-brown-900' : 'text-gray-400 hover:text-slate-600'}`}>
                {c === 'Tümü' ? 'TÜMÜ' : PRODUCT_CATEGORIES.find(cat => cat.id === c)?.label.toUpperCase()}
              </button>
            ))}
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
                    <span className="text-[10px] text-brown-900 dark:text-gold font-black bg-brown-50 dark:bg-brown-900/20 px-2.5 py-0.5 rounded uppercase tracking-wider">{PRODUCT_CATEGORIES.find(cat => cat.id === product.category)?.label}</span>
                    <span className="text-sm font-mono font-bold text-gray-400 italic">₺{product.price.toFixed(2)}</span>
                    {(product.locationStock?.yesilbahce || 0) === 0 && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">STOK YOK</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-14">
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
