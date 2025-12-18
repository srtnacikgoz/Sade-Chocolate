import React from 'react';
import { Product } from '../../types';
import { Input } from '../ui/Input';
import { useLanguage } from '../../context/LanguageContext';

interface ProductFormProps {
  form: Product;
  setForm: (form: Product) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  isAdding: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ form, setForm, onSave, onCancel, isAdding }) => {
  const { t } = useLanguage();
  const sensoryFields: (keyof NonNullable<Product['sensory']>)[] = ['intensity', 'sweetness', 'creaminess', 'fruitiness', 'acidity', 'crunch'];

  return (
    <section className="bg-gray-50 dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 mb-12 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-xl font-bold dark:text-white">{isAdding ? 'Yeni Ürün Oluştur' : 'Ürünü Düzenle'}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-500"><span className="material-icons-outlined">close</span></button>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ürün Başlığı" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <Input label="Fiyat (₺)" type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} required />
        </div>

        <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 border border-gray-100 dark:border-gray-700 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="material-icons-outlined text-gray-400">inventory_2</span>
            <div>
              <p className="text-xs font-bold dark:text-white uppercase tracking-wider">Stok Durumu</p>
              <p className="text-[10px] text-gray-400">Ürün tükendiğinde bu seçeneği kapatın.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setForm({...form, isOutOfStock: !form.isOutOfStock})}
            className={`w-12 h-6 rounded-full relative transition-colors ${form.isOutOfStock ? 'bg-gray-200 dark:bg-gray-700' : 'bg-green-500'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.isOutOfStock ? 'left-1' : 'left-7'}`}></div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Kategori</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="w-full p-3 bg-white dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none">
              <option value="tablet">Tablet</option>
              <option value="truffle">Truffle</option>
              <option value="gift-box">Hediye Kutusu</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Etiket</label>
            <select value={form.badge || ''} onChange={e => setForm({...form, badge: e.target.value})} className="w-full p-3 bg-white dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none">
              <option value="">Yok</option><option value="New">Yeni</option><option value="Sale">İndirim</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Görsel URL" value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
          <Input label="Video URL" value={form.video || ''} onChange={e => setForm({...form, video: e.target.value})} />
        </div>

        <Input label="Kısa Açıklama" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Detaylı Açıklama</label>
          <textarea value={form.detailedDescription} onChange={e => setForm({...form, detailedDescription: e.target.value})} className="w-full p-3 bg-white dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm h-32 resize-none dark:text-white outline-none" />
        </div>

        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
          <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-4 tracking-widest text-center">Duyusal Profil (0-100)</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {sensoryFields.map(field => (
              <div key={field}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500">{t(`sensory_${field}` as any)}</span>
                  <span className="text-xs font-bold text-gold">{form.sensory?.[field]}</span>
                </div>
                <input type="range" min="0" max="100" value={form.sensory?.[field] || 50} onChange={e => setForm({...form, sensory: { ...form.sensory, [field]: parseInt(e.target.value) } as any})} className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brown-900" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold uppercase text-gray-400">Vazgeç</button>
          <button type="submit" className="flex-[2] py-4 bg-brown-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl">Kaydet</button>
        </div>
      </form>
    </section>
  );
};